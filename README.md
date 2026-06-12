# Humara Pandit - Full-Stack Enterprise Astrologer CRM

An enterprise-grade CRM solution built to manage client leads, showcase a certified expert roster, and handle real-time appointment matrix scheduling with an administrative security gateway.

* **System Root Credentials:** Operator: `admin` | Key: `Chitkara2026`

---

## 📊 Short Project Notes

### 1. Technology Stack
* **UI Presentation Layer:** Next.js framework styled with Tailwind CSS layout structures.
* **Backend Processing Environment:** Node.js using the Express server routing matrix.
* **Cloud Database Core:** Remote cloud-hosted MongoDB Atlas Cluster.
* **Data Modeling Interface:** Mongoose Object Data Modeling (ODM).

### 2. Core Platform Architecture
The system acts as an interconnected client-server layout running asynchronous operational threads over isolated endpoints:
* **Inbound Ingestion Tunnel:** Captures incoming lead vectors, validating criteria before writing records to the database.
* **Relational Synchronization Matrix:** Handles scheduling by locking down target IDs (`leadId` $\rightarrow$ `astrologerId`) using embedded database `.populate()` references.
* **Administrative Control Hub:** A separate verification interface designed to allow operators to review records and update statuses.

### 3. Engineering Assumptions Built-in
* **Gmail Extension Rule:** The ingestion form assumes all incoming addresses belong to official `@gmail.com` accounts to maintain lead data purity.
* **Chronological Safety Boundary:** To ensure operational accuracy, sessions cannot be booked for past times; dates are locked to future timestamps.
* **Auto-Seeded Directory:** The expert roster seeds 6 unique specialist profiles automatically into the database if the collection is empty.

### 4. Future System Improvements
* **WebRTC Live Streams:** Adding secure, browser-based video calling frames directly inside the interface to connect clients with astrologers instantly.
* **Automated Webhooks:** Hooking up SMS/WhatsApp alerts to ping clients the moment an administrator shifts their appointment status to "Completed".
* **Revenue Metrics Dashboard:** Introducing charts to let administrators view daily and monthly earnings metrics across different specialists.