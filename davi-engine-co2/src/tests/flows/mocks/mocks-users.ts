import { db } from "../../../db/drizzle/client";
import { users } from "../../../db/drizzle/schema";
import { User } from "@features/users/domain/user.entity";



export class MocksUsers {


    static InitUsers = async () => {
        await db.insert(users).values(this.user1);
        await db.insert(users).values(this.user2);
    }



    static user1 = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    static user2 = {
        id: '2',
        createdAt: new Date(),
        updatedAt: new Date(),

    };

    static user3 = {
        id: '3',

    };
}