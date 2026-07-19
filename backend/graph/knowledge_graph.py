from typing import List, Dict, Optional
from loguru import logger

from core.config import settings


class KnowledgeGraph:
    """
    Neo4j knowledge graph for research concepts and relationships.
    Nodes: Paper, Concept, Author
    Edges: CITES, SUPPORTS, CONTRADICTS, AUTHORED_BY, MENTIONS
    """

    def __init__(self):
        self._driver = None

    def _connect(self):
        if self._driver:
            return
        try:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            self._driver.verify_connectivity()
            logger.info("Connected to Neo4j")
            self._create_constraints()
        except Exception as e:
            logger.error(f"Neo4j connection failed: {e}")
            self._driver = None

    def _create_constraints(self):
        if not self._driver:
            return
        queries = [
            "CREATE CONSTRAINT paper_id IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT author_name IF NOT EXISTS FOR (a:Author) REQUIRE a.name IS UNIQUE",
        ]
        with self._driver.session() as session:
            for q in queries:
                try:
                    session.run(q)
                except Exception:
                    pass

    def add_paper(self, paper: Dict):
        self._connect()
        if not self._driver:
            return
        with self._driver.session() as session:
            session.run(
                """
                MERGE (p:Paper {id: $id})
                SET p.title = $title,
                    p.year = $year,
                    p.venue = $venue,
                    p.citation_count = $citation_count,
                    p.source = $source
                """,
                id=paper.get("id", paper.get("arxiv_id", "")),
                title=paper.get("title", ""),
                year=paper.get("year", 0),
                venue=paper.get("venue", ""),
                citation_count=paper.get("citation_count", 0),
                source=paper.get("source", "arxiv"),
            )
            for author in paper.get("authors", []):
                session.run(
                    """
                    MERGE (a:Author {name: $name})
                    WITH a
                    MATCH (p:Paper {id: $paper_id})
                    MERGE (p)-[:AUTHORED_BY]->(a)
                    """,
                    name=author,
                    paper_id=paper.get("id", paper.get("arxiv_id", "")),
                )

    def add_claim_to_graph(self, claim: Dict):
        """Add claim concepts and relationships to graph."""
        self._connect()
        if not self._driver:
            return
        with self._driver.session() as session:
            for concept in [claim.get("subject", ""), claim.get("obj", "")]:
                if len(concept) > 3:
                    session.run(
                        """
                        MERGE (c:Concept {name: $name})
                        WITH c
                        MATCH (p:Paper {id: $paper_id})
                        MERGE (p)-[:MENTIONS]->(c)
                        """,
                        name=concept[:200],
                        paper_id=claim.get("paper_id", ""),
                    )

    def add_contradiction(self, paper_a_id: str, paper_b_id: str, score: float):
        self._connect()
        if not self._driver:
            return
        with self._driver.session() as session:
            session.run(
                """
                MATCH (a:Paper {id: $id_a}), (b:Paper {id: $id_b})
                MERGE (a)-[r:CONTRADICTS]->(b)
                SET r.score = $score
                """,
                id_a=paper_a_id,
                id_b=paper_b_id,
                score=score,
            )

    def get_concept_centrality(self, limit: int = 20) -> List[Dict]:
        """Return most central concepts by degree."""
        self._connect()
        if not self._driver:
            return []
        with self._driver.session() as session:
            result = session.run(
                """
                MATCH (c:Concept)<-[:MENTIONS]-(p:Paper)
                WITH c, count(p) AS degree
                ORDER BY degree DESC
                LIMIT $limit
                RETURN c.name AS concept, degree
                """,
                limit=limit,
            )
            return [{"concept": r["concept"], "degree": r["degree"]} for r in result]

    def get_contradictions(self, job_id: str = None) -> List[Dict]:
        self._connect()
        if not self._driver:
            return []
        with self._driver.session() as session:
            result = session.run(
                """
                MATCH (a:Paper)-[r:CONTRADICTS]->(b:Paper)
                RETURN a.title AS paper_a, b.title AS paper_b,
                       a.year AS year_a, b.year AS year_b, r.score AS score
                ORDER BY r.score DESC
                LIMIT 50
                """
            )
            return [dict(r) for r in result]

    def get_paper_network(self, limit: int = 50) -> Dict:
        """Get nodes and edges for frontend graph visualization."""
        self._connect()
        if not self._driver:
            return {"nodes": [], "edges": []}

        with self._driver.session() as session:
            paper_result = session.run(
                "MATCH (p:Paper) RETURN p.id AS id, p.title AS title, p.year AS year LIMIT $limit",
                limit=limit,
            )
            papers = [dict(r) for r in paper_result]

            concept_result = session.run(
                """
                MATCH (c:Concept)<-[:MENTIONS]-(p:Paper)
                WITH c, count(p) AS deg WHERE deg > 1
                RETURN c.name AS name, deg LIMIT 30
                """
            )
            concepts = [dict(r) for r in concept_result]

            edge_result = session.run(
                """
                MATCH (p:Paper)-[:MENTIONS]->(c:Concept)
                RETURN p.id AS source, c.name AS target LIMIT 200
                """
            )
            edges = [dict(r) for r in edge_result]

        nodes = (
            [{"id": p["id"], "label": p["title"][:40], "type": "paper", "year": p["year"]} for p in papers]
            + [{"id": c["name"], "label": c["name"][:30], "type": "concept", "degree": c["deg"]} for c in concepts]
        )
        return {"nodes": nodes, "edges": edges}

    def close(self):
        if self._driver:
            self._driver.close()
