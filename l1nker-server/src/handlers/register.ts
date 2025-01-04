import { hashPassword } from '../utils/auth';
import { Env } from '../types';
export async function handleRegister(request: Request, env: Env): Promise<Response> {
    try {
        const { username, password } = await request.json() as { username: string; password: string };
        const hashedPassword = await hashPassword(password, env);
        const query = `
            INSERT INTO l1nker_user (username, password)
            VALUES (?, ?);
        `;
        const dbResult = await env?.l1nker_db?.prepare(query).bind(username, hashedPassword).run();
        if (!dbResult) {
            return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({ message: 'Successfully registered' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
