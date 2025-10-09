import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, TrendingUp, FileText, CreditCard, Download, Eye, Send } from "lucide-react";
import { useState } from "react";

export default function Sales() {
  const [selectedPackage, setSelectedPackage] = useState("");

  const packages = [
    { id: "starter", name: "Starter Website", price: 2500, description: "Perfect for small businesses" },
    { id: "professional", name: "Professional Site", price: 4500, description: "Full-featured business site" },
    { id: "ecommerce", name: "E-commerce Package", price: 7500, description: "Complete online store" },
    { id: "custom", name: "Custom Solution", price: 0, description: "Tailored to your needs" },
  ];

  const addons = [
    { id: "seo", name: "SEO Optimization", price: 500 },
    { id: "maintenance", name: "Monthly Maintenance", price: 200 },
    { id: "hosting", name: "Premium Hosting (1yr)", price: 300 },
    { id: "content", name: "Content Writing", price: 800 },
  ];

  const invoices = [
    { id: "INV-2024-045", client: "Harbor View Restaurant", amount: 3500, status: "paid", date: "Dec 15, 2024", dueDate: "Dec 30, 2024" },
    { id: "INV-2024-044", client: "Coastal Cafe", amount: 5000, status: "sent", date: "Dec 12, 2024", dueDate: "Dec 27, 2024" },
    { id: "INV-2024-043", client: "Seaside Boutique", amount: 2800, status: "overdue", date: "Nov 28, 2024", dueDate: "Dec 13, 2024" },
    { id: "INV-2024-042", client: "Marina Yoga Studio", amount: 4200, status: "draft", date: "Dec 18, 2024", dueDate: "Jan 2, 2025" },
  ];

  const transactions = [
    { id: 1, date: "Dec 15, 2024", client: "Harbor View", amount: 3500, method: "Credit Card", status: "completed" },
    { id: 2, date: "Dec 10, 2024", client: "Beachfront Realty", amount: 7500, method: "Bank Transfer", status: "completed" },
    { id: 3, date: "Dec 5, 2024", client: "Coastal Cafe", amount: 2500, method: "Credit Card", status: "completed" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales & Orders</h1>
          <p className="text-muted-foreground mt-1">Manage orders and invoices</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$45.2k</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">+23%</p>
                <p className="text-sm text-muted-foreground">Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$12.5k</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Order Builder</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Create New Order</CardTitle>
              <CardDescription>Build a custom package for your client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Harbor View Restaurant</SelectItem>
                      <SelectItem value="2">Coastal Cafe</SelectItem>
                      <SelectItem value="3">Seaside Boutique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package">Base Package</Label>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                    <SelectTrigger id="package">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Add-on Services</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <Checkbox id={addon.id} />
                      <label htmlFor={addon.id} className="flex-1 cursor-pointer text-sm">
                        <div className="font-medium text-foreground">{addon.name}</div>
                        <div className="text-muted-foreground">${addon.price}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom">Custom Items</Label>
                <Input id="custom" placeholder="Add custom services or adjustments..." />
              </div>

              <div className="border-t border-border pt-4">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium text-foreground">$4,500.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-foreground">-$0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">$4,500.00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </Button>
                <Button variant="outline">Save as Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage your client invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.client}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            invoice.status === "paid" ? "default" :
                            invoice.status === "sent" ? "secondary" :
                            invoice.status === "overdue" ? "destructive" : "outline"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent transactions and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="font-medium">{transaction.client}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {transaction.method}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        ${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default">{transaction.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
