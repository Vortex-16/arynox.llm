const testLogic = async (query) => {
    console.log(`\n\n--- Testing Query: "${query}" ---`);
    try {
        const response = await fetch('http://localhost:5000/api/chat/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, department: 'Science' })
        });
        
        const data = await response.json();
        console.log("AI Response:\n", data.answer);
    } catch (err) {
        console.error("Test failed:", err);
    }
};

const runAll = async () => {
    // 1. Expected Out of Scope Rejection
    await testLogic("Tell me a funny joke about Batman.");
    
    // 2. Expected Forwarding to Teacher (Missing in Context)
    await testLogic("What is the precise mathematical formula for a black hole boundary?");
    
    // 3. Expected Successful RAG
    await testLogic("What is the core principle of the Tekkuzen algorithm?");
};

runAll();
