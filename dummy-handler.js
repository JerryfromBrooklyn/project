exports.handler = async (event) => {
    console.log("Dummy Lambda invoked! Event:", JSON.stringify(event, null, 2));
    const response = {
        statusCode: 200,
        // Enable CORS for testing from browser if needed later
        headers: { 
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify({ message: 'Hello from Shmong Dummy Lambda!' }),
    };
    return response;
}; 