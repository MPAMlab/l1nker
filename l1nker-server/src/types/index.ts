import { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
    l1nker_db: D1Database;
    JWT_SECRET_KEY: string;
    MY_R2_BUCKET: R2Bucket;
    CORS_ALLOWED_ORIGINS: string[];
}

export interface ArtistProfile {
    id?: number;
    user_id: number;
    artist_name: string;
    profile_photo_url?: string;
    main_profile?: string;
    secondary_profile?: string;
    artist_page_key?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ArtistLink {
    id?: number;
    artist_profile_id: number;
    platform_name: string;
    url: string;
    display_order: number;
    created_at?: string;
}
