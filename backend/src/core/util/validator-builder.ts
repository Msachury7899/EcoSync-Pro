import { z, ZodTypeAny } from "zod";



export class ValidatorBuilder<M extends Record<string, ZodTypeAny>> {

    constructor(private schemaMap: M) { }

    public validate<T extends keyof M>(
        dtoName: T,
        props: Record<string, unknown>
    ): z.infer<M[T]> {
        return this.schemaMap[dtoName].parse(props);
    }

    public safeValidate<T extends keyof M>(
        dtoName: T,
        props: Record<string, unknown>
    ): { success: true; data: z.infer<M[T]> } | { success: false; errors: string[] } {
        const result = this.schemaMap[dtoName].safeParse(props);
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return {
                success: false,
                errors: result.error.issues.map(e => e.message),
            };
        }
    }
}