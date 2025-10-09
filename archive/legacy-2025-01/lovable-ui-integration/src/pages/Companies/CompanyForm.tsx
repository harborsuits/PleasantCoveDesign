import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCompany, useCreateCompany, useUpdateCompany } from "@/lib/api/useCompanies";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Schema = z.object({
  name: z.string().min(1, "Company name is required"),
  contact_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  source: z.string().optional(),
  status: z.enum(["lead", "prospect", "active", "paused", "lost"]).default("lead"),
  tags: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function CompanyForm({ id, onDone }: { id: string | null; onDone: () => void }) {
  const { toast } = useToast();
  const { data } = useCompany(id || undefined);
  const create = useCreateCompany();
  const update = useUpdateCompany(id || "");

  const form = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { status: "lead" }
  });

  useEffect(() => {
    if (data) {
      form.reset({
        ...data,
        tags: data.tags?.join(", "),
      } as any);
    }
  }, [data]);

  const onSubmit = async (values: FormData) => {
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(",").map(s => s.trim()).filter(Boolean) : []
    };

    try {
      if (!id) {
        await create.mutateAsync(payload);
        toast({ title: "Company created successfully" });
      } else {
        await update.mutateAsync(payload);
        toast({ title: "Company updated successfully" });
      }
      onDone();
    } catch (error) {
      toast({ title: "Error saving company", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Company Name *</label>
        <Input placeholder="Enter company name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Contact Name</label>
          <Input placeholder="Primary contact" {...form.register("contact_name")} />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            {...form.register("status")}
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="company@email.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input placeholder="(555) 123-4567" {...form.register("phone")} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Website</label>
          <Input placeholder="https://company.com" {...form.register("website")} />
          {form.formState.errors.website && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.website.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Source</label>
          <Input placeholder="Google, Referral, etc." {...form.register("source")} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Tags</label>
        <Input placeholder="Comma separated tags" {...form.register("tags")} />
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <Input placeholder="Street address" {...form.register("address")} />
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea placeholder="Additional notes..." {...form.register("notes")} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={create.isPending || update.isPending}
        >
          {id ? "Update Company" : "Create Company"}
        </Button>
      </div>
    </form>
  );
}
