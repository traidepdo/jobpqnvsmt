import z from "zod"
import { ApplicationStatus } from "@prisma/client"

export const EmployerApplicationSchema = z.object({
    categoryId: z.string().optional(),
    jobId: z.string().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
})

export type EmployerApplicationSchema = z.infer<typeof EmployerApplicationSchema>
