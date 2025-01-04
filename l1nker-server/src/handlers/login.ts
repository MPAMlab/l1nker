import { SignJWT } from 'jose';
import { hashPassword, verifyPassword } from '../utils/auth';
import { Env } from '../types';
export async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const { username, password } = await request.json() as { username: string; password: string };
        const query = `SELECT id, username, password, managed_projects FROM l1nker_user WHERE username = ?`;
        const { results } = await env?.l1nker_db?.prepare(query).bind(username).all();
        if (!results) {
            return new Response(JSON.stringify({ error: "l1nker_db binding failed." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (results.length === 0) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const user = results[0];
        console.log("数据库中的哈希密码:", user.password);
        // 使用 PBKDF2 进行密码校验
        const passwordMatch = await verifyPassword(password, user.password, env);
        console.log("用户输入密码的哈希结果：", passwordMatch);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const jwtPayload = {
            userId: user.id,
            username: user.username,
            managedProjects: user.managed_projects,
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 过期时间：1小时
        };
        const token = await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(new TextEncoder().encode(env.JWT_SECRET_KEY));

        return new Response(JSON.stringify({ token }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to process login request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
