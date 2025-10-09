import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, Globe } from 'lucide-react';
import { useCompanies, Company } from '@/hooks/useCompanies';

interface CompaniesTableProps {
  onCreateCompany?: () => void;
  onEditCompany?: (company: Company) => void;
  onDeleteCompany?: (companyId: number) => void;
  onViewCompany?: (company: Company) => void;
}

export default function CompaniesTable({
  onCreateCompany,
  onEditCompany,
  onDeleteCompany,
  onViewCompany,
}: CompaniesTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: companiesData, isLoading, error } = useCompanies(search, page);

  const companies = companiesData?.items || [];
  const totalPages = companiesData?.totalPages || 1;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading companies: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies
            </CardTitle>
            <CardDescription>
              Manage your client companies and organizations
            </CardDescription>
          </div>
          <Button onClick={onCreateCompany} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No companies found. Click "Add Company" to get started.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => onViewCompany?.(company)}>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.website && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {company.website}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {company.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {company.email}
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {company.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.industry || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {company.priority && (
                        <Badge className={getPriorityColor(company.priority)}>
                          {company.priority}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* This would need to be fetched separately or included in the API response */}
                      <span className="text-sm text-muted-foreground">0 projects</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCompany?.(company);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCompany?.(company.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
