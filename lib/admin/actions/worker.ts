"use server";

import { workers } from "@/database/schema";
import { db } from "@/database/drizzle";
import { WorkerParams } from "@/types"; // ou le chemin approprié

export const createWorker = async (params: WorkerParams) => {
  try {
    const newWorker = await db
      .insert(workers)
      .values({
        ...params,
        availableSlots: params.totalSlots, // On initialise availableSlots avec totalSlots
      })
      .returning();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newWorker[0])),
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "An error occurred while creating the worker",
    };
  }
};
