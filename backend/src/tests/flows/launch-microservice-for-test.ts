
import { Server } from "../../core/config/server";
import { envs } from "../../core/envs";
import { AppRoutes } from "../../core/config/routes/app-routes";
import { controlAppConfig } from "../../core/config/deploy/control-microservices";
import { buildSwaggerSpec } from "../../core/bootstrap/swagger";
import { sql } from "drizzle-orm";
import { db } from "../../db/drizzle/client";
import { allServiceConfigs } from "@core/config/deploy/monolith";


export const refreshDB = async () => {

    const statement = sql`
            DO $$ 
            DECLARE 
                row record;
            BEGIN             
                FOR row IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
                LOOP 
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(row.tablename) || ' CASCADE;'; 
                END LOOP; 
            END $$;
        `;
    const res = await db.execute(statement)
    console.log(res);
}



export const controlServer = new Server({
    port: envs.PORT,
    routes: AppRoutes.buildMonolith(allServiceConfigs),
    swaggerSpec: buildSwaggerSpec(allServiceConfigs),
});

