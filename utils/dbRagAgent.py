import sys
import json
import sqlite3
import os
from typing import List, Dict

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(json.dumps({"error": "google-genai Python package not installed"}))
    sys.exit(1)

class MaterialDatabaseRAG:
    def __init__(self):
        self.conn = sqlite3.connect(":memory:")
        self._init_db()
        self._seed_materials()

    def _init_db(self):
        cursor = self.conn.cursor()
        
        # Create FTS table for material properties and descriptions
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS materials_rag USING fts5(
                name, formula, crystal_system, space_group, density, description
            )
        """)
        self.conn.commit()

    def _seed_materials(self):
        # We simulate a rich database of materials and crystallography knowledge
        docs = [
            ("Quartz", "SiO2", "Hexagonal", "P3121", 2.65, "Alpha-quartz silica structure with trigonal symmetry. Highly piezoelectric, used in precision oscillators."),
            ("Rutile", "TiO2", "Tetragonal", "P42/mnm", 4.23, "Most stable natural titanium dioxide polymorph. Highly refractive standard, used for optics and antireflective coatings."),
            ("Anatase", "TiO2", "Tetragonal", "I41/amd", 3.89, "Metastable TiO2 phase, preferred for photocatalysis and solar cells. Converts to Rutile at 600C."),
            ("Halite", "NaCl", "Cubic", "Fm-3m", 2.16, "Rock salt with classic face-centered cubic lattice. Perfect cleavage along {100} planes."),
            ("Corundum", "Al2O3", "Trigonal", "R-3c", 3.95, "Extremely hard aluminum oxide, standard reference material for line profile analysis and instrumental broadening."),
            ("Silicon", "Si", "Cubic", "Fd-3m", 2.33, "Diamond cubic structure. Reference standard for XRD zero-shift calibration."),
            ("Graphite", "C", "Hexagonal", "P63/mmc", 2.26, "Layered carbon structure with strong intra-layer and weak inter-layer van der Waals forces.")
        ]
        
        self.conn.cursor().executemany("INSERT INTO materials_rag (name, formula, crystal_system, space_group, density, description) VALUES (?, ?, ?, ?, ?, ?)", docs)
        self.conn.commit()

    def retrieve(self, query: str, limit: int = 3) -> List[Dict]:
        cursor = self.conn.cursor()
        # Clean query
        keywords = "".join([c if c.isalnum() else " " for c in query]).split()
        if not keywords:
            return []
            
        fts_query = " OR ".join(keywords)
        try:
            cursor.execute("""
                SELECT name, formula, crystal_system, space_group, density, description, rank 
                FROM materials_rag 
                WHERE materials_rag MATCH ? 
                ORDER BY rank 
                LIMIT ?
            """, (fts_query, limit))
            
            return [{"name": row[0], "formula": row[1], "crystal_system": row[2], "space_group": row[3], "density": row[4], "description": row[5]} for row in cursor.fetchall()]
        except Exception as e:
            return []

    def answer_query(self, query: str, api_key: str):
        docs = self.retrieve(query)
        
        grounding_context = "=== MATERIALS DATABASE RETRIEVAL ===\n"
        if docs:
            for d in docs:
                grounding_context += f"- {d['name']} ({d['formula']}): {d['crystal_system']} lattice, Space Group {d['space_group']}, Density {d['density']} g/cm³. {d['description']}\n"
        else:
            grounding_context += "No specific matches found in the local database.\n"
            
        prompt = (
            "You are an AI Materials Science Assistant. Answer the user's question using the retrieved knowledge base data.\n\n"
            f"{grounding_context}\n\n"
            f"User Question: {query}\n"
        )
        
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )
            return json.dumps({
                "success": True,
                "answer": response.text,
                "retrieved_docs": docs
            })
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", required=True, type=str)
    parser.add_argument("--api_key", required=True, type=str)
    args = parser.parse_args()
    
    rag = MaterialDatabaseRAG()
    print(rag.answer_query(args.query, args.api_key))
