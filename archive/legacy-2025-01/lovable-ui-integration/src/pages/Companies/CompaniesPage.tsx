import { useState } from "react";
import { useCompanyList, useDeleteCompany } from "@/lib/api/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Building2 } from "lucide-react";
import CompanyForm from "./CompanyForm";

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const list = useCompanyList({ query, status, page, pageSize: 20, sort: "created_at:desc" });
  const del = useDeleteCompany();

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await del.mutateAsync(id);
        toast({ title: "Company deleted successfully" });
      } catch (error) {
        toast({ title: "Failed to delete company", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Companies
          </h1>
          <p className="text-muted-foreground mt-1">Manage your client companies and relationships</p>
        </div>
        <Button onClick={() => { setEditId(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search companies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
            />
            <select
              className="border rounded px-3 py-2 bg-background"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            {list.data?.total || 0} companies total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="text-center py-8">Loading companies...</div>
          ) : list.data?.items?.length ? (
            <div className="space-y-4">
              {list.data.items.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      <Badge variant="secondary">{company.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Contact:</span> {company.contact_name || "—"}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {company.email || "—"}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {company.phone || "—"}
                      </div>
                    </div>
                    {company.tags?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {company.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditId(company.id); setOpen(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(company.id, company.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {list.data && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {page} of {Math.ceil(list.data.total / 20)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!list.data.hasMore}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No companies found. Click "Add Company" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Company" : "Add New Company"}</DialogTitle>
          </DialogHeader>
          <CompanyForm
            id={editId}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
