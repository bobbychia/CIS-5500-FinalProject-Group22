# Milestone 4 (Apr. 20) — from course guidelines

Deliverables to align with **CIS 5500 Project Guidelines**:

1. **API specification (PDF to Gradescope)**  
   Document each route with: path + HTTP method + short description; **request** params (path vs query, types, required/optional); **response** fields.  
   This repo includes `docs/api/openapi.yaml` as a starting point; FastAPI also serves interactive docs at `/docs` when the backend runs.

2. **Routes vs SQL queries**  
   You need **routes corresponding to each of your (at least) 10 queries**, plus any auxiliary routes. Each route should map to one parameterized query (or a small family of queries). It is OK to adjust the API as you go; include the **final** spec in the Milestone 5 report.

3. **Mentor check-in (Zoom)**  
   **Backend API should be done and testable** (e.g. curl, Swagger, or Postman). Show **basic functionality** started (e.g. search returns real rows from RDS). All teammates attend.

4. **Application scope (overall project)**  
   The app should have **multiple distinct pages** that **interact with the database** (e.g. search + listing detail + optional favorites).
