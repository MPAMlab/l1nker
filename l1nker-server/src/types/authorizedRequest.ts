import { Request } from "@cloudflare/workers-types";
export interface AuthorizedRequest extends Request {
    managedProjects: string | Array<{ redirectKey: string }>;
    userId: number;
    username: string;
}
