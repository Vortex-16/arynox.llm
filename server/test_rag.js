const fs = require('fs');
const path = require('path');

const testRAG = async () => {
    try {
        console.log("=== 1. Starting RAG Retrieval Verification ===");
        
        // Step 1: Create a mock academic document
        const filePath = path.join(__dirname, 'mock_lecture.txt');
        fs.writeFileSync(filePath, "The core principle of the Tekkuzen algorithm is that it sorts items by quantum flux capacity. It was invented in 2026.");
        console.log("Mock text document generated.");

        // Step 2: Upload the document directly using FormData
        console.log("=== 2. Hitting /api/documents/upload ===");
        const formData = new FormData();
        formData.append('title', 'Quantum Flux Lecture');
        formData.append('department', 'Computer Science');
        
        const blob = new Blob([fs.readFileSync(filePath)], { type: 'text/plain' });
        formData.append('document', blob, 'mock_lecture.txt');

        const uploadRes = await fetch('http://localhost:5000/api/documents/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();
        console.log("Upload Response:", uploadData);
        
        // Clean up the dummy file
        fs.unlinkSync(filePath);

        // Allow ChromaDB a second to index
        await new Promise(r => setTimeout(r, 2000));

        // Step 3: Query the Chat endpoint
        console.log("=== 3. Hitting /api/chat/ask to test Retrieval ===");
        const chatRes = await fetch('http://localhost:5000/api/chat/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'Can you tell me what the core principle of the Tekkuzen algorithm is?',
                department: 'Computer Science'
            })
        });
        
        const chatData = await chatRes.json();
        console.log("\n=== FINAL AI SOCRATIC RESPONSE ===");
        console.log(chatData.answer);
        console.log("----------------------------------");
        console.log("Sources Cited:", chatData.sources);

    } catch (err) {
        console.error("Test failed:", err);
    }
};

testRAG();
