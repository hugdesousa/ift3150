import React from "react";
import WorkerCard from "@/components/worker/WorkerCard";
import { WorkerType } from "@/types"; // ou un chemin adapté

interface Props {
  title: string;
  workers: WorkerType[]; // Assure-toi d'avoir défini le type Worker dans tes types
  containerClassName?: string;
}

const WorkerList = ({ title, workers, containerClassName }: Props) => {
  if (workers.length < 1) return null;

  return (
    <section className={containerClassName}>
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>
      <ul className="worker-list">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} {...worker} />
        ))}
      </ul>
    </section>
  );
};

export default WorkerList;
