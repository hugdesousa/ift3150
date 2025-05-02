"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { workerSchema } from "@/lib/validations/validations"; // Assure-toi d'avoir un schéma workerSchema défini
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/ui/FileUpload";
import ColorPicker from "@/components/admin/ColorPicker";
import { createWorker } from "@/lib/admin/actions/worker"; // Action pour créer un worker
import { toast } from "@/hooks/use-toast";

interface Props extends Partial<WorkerType> {
  type?: "create" | "update";
}

const WorkerForm = ({ type, ...worker }: Props) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      fullName: "",
      skill: "",
      category: "",
      rating: 1,
      totalSlots: 1,
      availableSlots: 1,
      coverUrl: "",
      coverColor: "",
      videoUrl: "",
      description: "",
      summary: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof workerSchema>) => {
    const result = await createWorker(values);

    if (result.success) {
      toast({
        title: "Success",
        description: "Worker created successfully",
      });
      router.push(`/admin/workers/${result.data.id}`);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Worker Name
              </FormLabel>
              <FormControl>
                <Input
                  required
                  placeholder="Worker full name"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skill"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Skill
              </FormLabel>
              <FormControl>
                <Input
                  required
                  placeholder="e.g., Painter, Mechanic"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Category
              </FormLabel>
              <FormControl>
                <Input
                  required
                  placeholder="e.g., Home Services, Automotive"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Rating
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  placeholder="Worker rating"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalSlots"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Total Slots
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Total appointment slots"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableSlots"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Available Slots
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="Available appointment slots"
                  {...field}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverUrl"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Worker Image
              </FormLabel>
              <FormControl>
                <FileUpload
                  type="image"
                  accept="image/*"
                  placeholder="Upload a worker image"
                  folder="workers/covers"
                  variant="light"
                  onFileChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverColor"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Primary Color
              </FormLabel>
              <FormControl>
                <ColorPicker
                  onPickerChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Worker Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter worker description"
                  {...field}
                  rows={10}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Worker Video (optional)
              </FormLabel>
              <FormControl>
                <FileUpload
                  type="video"
                  accept="video/*"
                  placeholder="Upload a worker video"
                  folder="workers/videos"
                  variant="light"
                  onFileChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="text-base font-normal text-dark-500">
                Worker Summary
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter worker summary"
                  {...field}
                  rows={5}
                  className="worker-form_input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="worker-form_btn text-white">
          {type === "update" ? "Update Worker" : "Add Worker"}
        </Button>
      </form>
    </Form>
  );
};

export default WorkerForm;
