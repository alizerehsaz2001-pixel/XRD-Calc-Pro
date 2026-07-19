import sys
import json
import sqlite3
import os
from typing import List, Dict

try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False

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
        # Richer seed database derived from our scientific materials database
        docs = [
            ("Quartz (Alpha-SiO2)", "SiO2", "Hexagonal", "P3121", 2.65, 
             "Alpha-quartz silica structure with trigonal symmetry. Highly piezoelectric, used in precision oscillators and electronic timing circuits."),
            ("Rutile (Tetragonal-TiO2)", "TiO2", "Tetragonal", "P42/mnm", 4.23, 
             "Most stable natural titanium dioxide polymorph under standard conditions. Possesses one of the highest refractive indices of any mineral (n=2.7), extensively utilized in optical coatings, sunscreens, and white pigments."),
            ("Anatase (Tetragonal-TiO2)", "TiO2", "Tetragonal", "I41/amd", 3.89, 
             "Metastable tetragonal titanium dioxide polymorph. Displays highly active photocatalysis, preferred for dye-sensitized solar-cell coatings, hydrogen production, and anti-bacterial surfaces. Converts irreversibly to Rutile phase above 600°C."),
            ("Halite (NaCl)", "NaCl", "Cubic", "Fm-3m", 2.16, 
             "Rock salt crystal with classic face-centered cubic lattice. Features perfect octahedral coordination with isotropic physical traits and perfect cleavage along {100} planes."),
            ("Corundum (Alpha-Al2O3)", "Al2O3", "Trigonal", "R-3c", 3.97, 
             "Extremely hard monocrystalline aluminum oxide (Mohs 9), isomorphic to sapphire and ruby. Standard reference peak calibrant for peak profile analysis and instrumental broadening resolution in powder XRD."),
            ("Silicon (Zero-Shift Standard)", "Si", "Cubic", "Fd-3m", 2.33, 
             "Pure diamond cubic structure. Serves as the primary global calibration standard (SRM 640) for determining 2-theta zero-point offset shift error in instrumentation alignment studies."),
            ("Graphite (Hexagonal-C)", "C", "Hexagonal", "P63/mmc", 2.26, 
             "Layered carbon allotrope structured with closely bound sp2 honeycombs held together by weak inter-planar dispersion/van der Waals forces, leading to strong mechanical and thermal anisotropy."),
            ("Magnetite (Fe3O4)", "Fe3O4", "Cubic", "Fd-3m", 5.15, 
             "Classic ferrimagnetic inverse-spinel iron oxide. Demonstrates highly correlated electron transport and undergoes a dramatic metal-insulator transition (the Verwey Transition) when cooled below 120 K."),
            ("Calcite (CaCO3)", "CaCO3", "Trigonal", "R-3c", 2.71, 
             "The most common, thermodynamically stable polymorph of calcium carbonate. Renowned for its extreme birefringence and geological diagnostic role in carbon capture mineralization."),
            ("Perovskite (CaTiO3)", "CaTiO3", "Orthorhombic", "Pnma", 4.04, 
             "The fundamental structural prototype for ABO3-class minerals. Exhibits a corner-sharing octahedral network which undergoes structural tilting, heavily studied for ferroelectric, piezoelectric, and solar-cell absorber technologies."),
            ("Lithium Cobalt Oxide (LiCoO2)", "LiCoO2", "Hexagonal", "R-3m", 5.06, 
             "Layered transition metal oxide consisting of alternating sheets of cobalt-oxygen octahedra and lithium planes. Serves as the quintessential primary cathode layer for high energy-density rechargeable lithium-ion battery cells.")
        ]
        
        self.conn.cursor().executemany("INSERT INTO materials_rag (name, formula, crystal_system, space_group, density, description) VALUES (?, ?, ?, ?, ?, ?)", docs)
        self.conn.commit()

    def retrieve(self, query: str, limit: int = 4) -> List[Dict]:
        cursor = self.conn.cursor()
        
        STOP_WORDS = {
            "the", "a", "an", "and", "or", "of", "in", "to", "for", "with", "is", "are", 
            "was", "were", "on", "at", "by", "from", "show", "me", "find", "search", 
            "material", "materials", "structure", "crystal", "system", "lattice", 
            "properties", "density", "what", "how", "who", "where", "when", "why", 
            "please", "give", "info", "information", "detail", "details", "about"
        }
        
        # Clean query
        words = "".join([c if c.isalnum() else " " for c in query]).split()
        keywords = [w for w in words if w.lower() not in STOP_WORDS]
        if not keywords:
            keywords = words # Fallback to original list if all are filtered as stop words
        if not keywords:
            return []
            
        # Build robust SQLite FTS Query with wildcards
        fts_clauses = []
        for kw in keywords:
            fts_clauses.append(f'"{kw}"')
            fts_clauses.append(f'"{kw}"*')
        fts_query = " OR ".join(fts_clauses)
        
        try:
            cursor.execute("""
                SELECT name, formula, crystal_system, space_group, density, description, rank 
                FROM materials_rag 
                WHERE materials_rag MATCH ? 
                ORDER BY rank 
                LIMIT ?
            """, (fts_query, limit))
            
            rows = cursor.fetchall()
            
            # Substring-LIKE Fallback query if FTS matched nothing
            if not rows and keywords:
                like_clauses = []
                like_params = []
                for kw in keywords:
                    like_clauses.append("(name LIKE ? OR formula LIKE ? OR description LIKE ?)")
                    like_params.extend([f"%{kw}%", f"%{kw}%", f"%{kw}%"])
                like_query = " OR ".join(like_clauses)
                
                cursor.execute(f"""
                    SELECT name, formula, crystal_system, space_group, density, description, 0
                    FROM materials_rag
                    WHERE {like_query}
                    LIMIT ?
                """, like_params + [limit])
                rows = cursor.fetchall()
                
            return [{"name": row[0], "formula": row[1], "crystal_system": row[2], "space_group": row[3], "density": row[4], "description": row[5]} for row in rows]
        except Exception as e:
            # Simplest fallback
            try:
                simple_fts = " OR ".join(keywords)
                cursor.execute("""
                    SELECT name, formula, crystal_system, space_group, density, description, rank 
                    FROM materials_rag 
                    WHERE materials_rag MATCH ? 
                    ORDER BY rank 
                    LIMIT ?
                """, (simple_fts, limit))
                return [{"name": row[0], "formula": row[1], "crystal_system": row[2], "space_group": row[3], "density": row[4], "description": row[5]} for row in cursor.fetchall()]
            except:
                return []

    def answer_query(self, query: str, api_key: str):
        docs = self.retrieve(query)
        
        grounding_context = "=== SCIENTIFIC REFERENCE DATABASE RETRIEVAL ===\n"
        if docs:
            for d in docs:
                grounding_context += f"- {d['name']} ({d['formula']}): {d['crystal_system']} lattice, Space Group {d['space_group']}, Density {d['density']} g/cm³. {d['description']}\n"
        else:
            grounding_context += "No specific matches found in the local micro-database.\n"
            
        prompt = (
            "You are a Senior Materials Crystallographer AI Assistant. Answer the researcher's query using the retrieved knowledge base context.\n\n"
            f"{grounding_context}\n"
            "=== SCIENTIFIC INSTRUCTIONS ===\n"
            "1. CITE and REFERENCE specific crystallographic parameters (e.g. Space Group, Crystal System, Density) in detail.\n"
            "2. EXPLAIN the structural-property relationship where appropriate (e.g., explaining why a metastable phase behaves a certain way or why symmetry is broken).\n"
            "3. STRUCT_OUT: Construct a beautifully structured, highly scannable Markdown output with concise tables or bullet lists where appropriate.\n"
            "4. OUTBOUND: If the retrieved database is helpful but limited, augment with deep established physical mineralogy to guide the researcher to a professional conclusion.\n\n"
            f"User Query: {query}\n"
            "Expert Comprehensive Response:\n"
        )
        
        if not has_genai:
            # Fallback when AI generation is optional / unavailable
            fallback_text = "*(AI Generation is optional or unavailable. Showing direct database retrieval results)*\n\n"
            for d in docs:
                fallback_text += f"**{d['name']}** ({d['formula']})\n- Crystal System: {d['crystal_system']}, Space Group: {d['space_group']}\n- {d['description']}\n\n"
            if not docs:
                fallback_text += "No matching documents found in the database."
            return json.dumps({
                "success": True,
                "answer": fallback_text,
                "retrieved_docs": docs
            })

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
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
