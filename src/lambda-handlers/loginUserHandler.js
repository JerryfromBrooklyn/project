// import * as databaseService from '../services/databaseService'; // Adjust path if needed
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken'; // For session tokens (install: npm i jsonwebtoken @types/jsonwebtoken)
// --- Helper Function for Responses ---
const createResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        body: JSON.stringify(body),
    };
};
// --- Lambda Handler --- 
export const handler = async (event) => {
    console.log("LoginUserHandler invoked. Event body:", event.body);
    if (!event.body) {
        return createResponse(400, { message: 'Missing request body.' });
    }
    try {
        // TODO: Parse email, password from event.body
        const { email, password } = JSON.parse(event.body);
        if (!email || !password) {
            return createResponse(400, { message: 'Missing email or password.' });
        }
        // TODO: Find user by email (using databaseService.findUserByEmail - needs implementation)
        // const user = await databaseService.findUserByEmail(email);
        // if (!user) {
        //     return createResponse(401, { message: 'Invalid credentials.' }); // User not found
        // }
        // TODO: Compare provided password with stored hash (using bcrypt.compare)
        // const isMatch = await bcrypt.compare(password, user.passwordHash);
        // if (!isMatch) {
        //     return createResponse(401, { message: 'Invalid credentials.' }); // Password incorrect
        // }
        // --- Login successful --- 
        // TODO: Generate JWT token or session identifier
        // const jwtSecret = process.env.JWT_SECRET || 'your-default-secret'; // Load from env!
        // const token = jwt.sign({ userId: user.userId, email: user.email }, jwtSecret, { expiresIn: '1h' });
        const token = `dummy_token_for_${email}`; // **PLACEHOLDER**
        console.log(`User ${email} logged in successfully.`);
        // Return token (and maybe some user info)
        return createResponse(200, {
            message: 'Login successful!',
            token: token,
            // user: { userId: user.userId, email: user.email } // Don't send hash!
        });
    }
    catch (error) {
        console.error("Error during login:", error);
        return createResponse(500, { message: 'Internal server error during login.', error: error.message });
    }
};
