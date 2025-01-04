import { D1Database, R2Bucket } from "@cloudflare/workers-types";
export interface Env {
    l1nker_db: D1Database;
    JWT_SECRET_KEY: string;
    MY_R2_BUCKET: R2Bucket;
}
