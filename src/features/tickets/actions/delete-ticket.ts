"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ticketsPath } from "@/routes";

export const deleteTicket = async (id: string) => {
  await prisma.ticket.delete({
    where: { id },
  });
  redirect(ticketsPath());
};
