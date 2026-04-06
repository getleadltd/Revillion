import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Helmet } from 'react-helmet-async';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Mail, Eye, Archive, Trash2, Search, Phone, Building2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  contact_type: string;
  subject: string;
  message: string;
  phone: string | null;
  company_name: string | null;
  status: string;
  created_at: string;
};

const ContactMessages = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['contact-messages', statusFilter, typeFilter, searchQuery],
    queryFn: async () => {
      let query: any = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (typeFilter !== 'all') query = query.eq('contact_type', typeFilter);

      if (searchQuery) {
        const sanitized = searchQuery.trim().replace(/[%_'"\\]/g, '');
        if (sanitized) {
          query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,company_name.ilike.%${sanitized}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({ title: 'Stato aggiornato' });
    },
    onError: () => toast({ title: 'Errore aggiornamento stato', variant: 'destructive' }),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      setSelectedMessage(null);
      toast({ title: 'Messaggio eliminato' });
    },
    onError: () => toast({ title: 'Errore eliminazione', variant: 'destructive' }),
  });

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'new') {
      updateStatusMutation.mutate({ id: message.id, status: 'read' });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      new: { label: 'Nuovo', variant: 'default' },
      read: { label: 'Letto', variant: 'secondary' },
      replied: { label: 'Risposto', variant: 'outline' },
      archived: { label: 'Archiviato', variant: 'outline' },
    };
    const { label, variant } = map[status] || { label: status, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      affiliate: 'bg-blue-500/10 text-blue-500',
      partner: 'bg-green-500/10 text-green-500',
      general: 'bg-gray-500/10 text-gray-500',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  const newMessagesCount = messages?.filter(m => m.status === 'new').length || 0;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Messaggi Contatto</h1>
              <p className="text-muted-foreground">Gestisci le richieste in arrivo</p>
            </div>
            {newMessagesCount > 0 && (
              <Badge variant="default" className="text-base px-3 py-1">
                {newMessagesCount} Nuovi
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle>Filtri</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome, email, azienda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Filtra per stato" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="new">Nuovo</SelectItem>
                    <SelectItem value="read">Letto</SelectItem>
                    <SelectItem value="replied">Risposto</SelectItem>
                    <SelectItem value="archived">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Filtra per tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="general">Generale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Oggetto</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Caricamento...</TableCell>
                    </TableRow>
                  ) : messages?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessun messaggio trovato
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages?.map((message) => (
                      <TableRow
                        key={message.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${message.status === 'new' ? 'bg-primary/5 font-medium' : ''}`}
                        onClick={() => openMessage(message)}
                      >
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(message.created_at), 'dd/MM/yy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{message.name}</p>
                            {message.company_name && (
                              <p className="text-xs text-muted-foreground">{message.company_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{message.email}</TableCell>
                        <TableCell>{getTypeBadge(message.contact_type)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{message.subject}</TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" title="Leggi"
                              onClick={() => openMessage(message)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Rispondi via email"
                              onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            {message.status !== 'archived' && (
                              <Button variant="ghost" size="sm" title="Archivia"
                                onClick={() => updateStatusMutation.mutate({ id: message.id, status: 'archived' })}>
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title="Elimina"
                              onClick={() => { if (confirm('Eliminare questo messaggio?')) deleteMessageMutation.mutate(message.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail Sheet */}
        <Sheet open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            {selectedMessage && (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-lg leading-tight pr-6">{selectedMessage.subject}</SheetTitle>
                </SheetHeader>

                <div className="space-y-5">
                  {/* Sender info */}
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{selectedMessage.name}</span>
                      {getTypeBadge(selectedMessage.contact_type)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{selectedMessage.phone}</span>
                      </div>
                    )}
                    {selectedMessage.company_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{selectedMessage.company_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{format(new Date(selectedMessage.created_at), 'dd MMMM yyyy, HH:mm')}</span>
                    </div>
                  </div>

                  {/* Message body */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Messaggio</p>
                    <div className="rounded-lg border p-4 bg-background text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Stato:</span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Rispondi
                    </Button>
                    {selectedMessage.status !== 'replied' && (
                      <Button variant="outline" onClick={() => {
                        updateStatusMutation.mutate({ id: selectedMessage.id, status: 'replied' });
                        setSelectedMessage({ ...selectedMessage, status: 'replied' });
                      }}>
                        Segna come risposto
                      </Button>
                    )}
                    {selectedMessage.status !== 'archived' && (
                      <Button variant="outline" onClick={() => {
                        updateStatusMutation.mutate({ id: selectedMessage.id, status: 'archived' });
                        setSelectedMessage(null);
                      }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archivia
                      </Button>
                    )}
                    <Button variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Eliminare questo messaggio?')) {
                          deleteMessageMutation.mutate(selectedMessage.id);
                        }
                      }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </AdminLayout>
    </>
  );
};

export default ContactMessages;
