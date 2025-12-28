"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/layout/header";
import Footer from "../../../components/layout/footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Loader2,
  UserCircle,
  Search,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { useAuthStore } from "../../../lib/store";
import { getAllUsers, adminUpdateUser, getUserById } from "../../../lib/api";
import { withToast, showErrorToast } from "../../../lib/api-toast";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers(1, 50, search);
      setUsers(res.data);
    } catch (error) {
      showErrorToast(error, "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (
    userId: string,
    data: { role?: string; status?: string }
  ) => {
    try {
      setUpdating(userId);
      await withToast(() => adminUpdateUser(userId, data), {
        successMessage: "User updated successfully",
      });
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...data } : u)));
    } catch (error) {
      // Error toast already shown by withToast
    } finally {
      setUpdating(null);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      setViewLoading(true);
      const res = await getUserById(userId);
      setSelectedUser(res.data || res);
    } catch (error) {
      showErrorToast(error, "Failed to fetch user details");
    } finally {
      setViewLoading(false);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-destructive hover:bg-destructive/90">
            <ShieldCheck className="w-3 h-3 mr-1" /> Admin
          </Badge>
        );
      case "management":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <Shield className="w-3 h-3 mr-1" /> Manager
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <UserCircle className="w-3 h-3 mr-1" /> User
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-headline text-accent mb-2">
              User Management
            </h1>
            <p className="text-muted-foreground flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" /> Admin Portal
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10 bg-background border-accent/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-accent/10 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-accent/5">
                  <TableRow>
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow
                        key={u.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCircle className="h-6 w-6 text-primary" />
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="w-3 h-3 mr-2" />
                            {u.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              onOpenChange={(open) =>
                                !open && setSelectedUser(null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary"
                                  onClick={() => handleViewUser(u.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>User Profile</DialogTitle>
                                  <DialogDescription>
                                    Detailed information about the user.
                                  </DialogDescription>
                                </DialogHeader>
                                {viewLoading ? (
                                  <div className="flex justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : selectedUser ? (
                                  <div className="grid gap-4 py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <UserCircle className="h-10 w-10 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold">
                                          {selectedUser.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedUser.email}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                      <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          Role
                                        </p>
                                        <div className="mt-1">
                                          {getRoleBadge(selectedUser.role)}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          Status
                                        </p>
                                        <p className="mt-1 capitalize text-green-600 font-medium">
                                          {selectedUser.status || "Active"}
                                        </p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          User ID
                                        </p>
                                        <p className="mt-1 text-xs font-mono break-all bg-accent/5 p-2 rounded">
                                          {selectedUser.id}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                          Joined
                                        </p>
                                        <p className="mt-1">
                                          {new Date(
                                            selectedUser.created_at
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={
                                    updating === u.id ||
                                    u.id === currentUser?.id
                                  }
                                >
                                  {updating === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Manage"
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Manage User: {u.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Update user role or status.
                                  </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="role" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="role">Role</TabsTrigger>
                                    <TabsTrigger value="status">
                                      Status
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="role" className="pt-4">
                                    <div className="space-y-4">
                                      <p className="text-sm text-muted-foreground">
                                        Select a new role for this user.
                                      </p>
                                      <Select
                                        value={u.role}
                                        onValueChange={(value) =>
                                          handleUserUpdate(u.id, {
                                            role: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="user">
                                            User
                                          </SelectItem>
                                          <SelectItem value="management">
                                            Manager
                                          </SelectItem>
                                          <SelectItem value="admin">
                                            Admin
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="status" className="pt-4">
                                    <div className="space-y-4">
                                      <p className="text-sm text-muted-foreground">
                                        Update the user's account status.
                                      </p>
                                      <Select
                                        value={u.status || "active"}
                                        onValueChange={(value) =>
                                          handleUserUpdate(u.id, {
                                            status: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">
                                            Active
                                          </SelectItem>
                                          <SelectItem value="inactive">
                                            Inactive
                                          </SelectItem>
                                          <SelectItem value="suspended">
                                            Suspended
                                          </SelectItem>
                                          <SelectItem value="pending">
                                            Pending
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
