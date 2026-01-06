import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant, useRestaurantTables, RestaurantTable } from '@/hooks/useRestaurant';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Download, QrCode, Grid3X3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DashboardTables = () => {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { tables, addTable, updateTable, deleteTable } = useRestaurantTables(restaurant?.id);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [showQRDialog, setShowQRDialog] = useState<RestaurantTable | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !restaurantLoading && user && !restaurant) {
      navigate('/onboarding');
    }
  }, [user, restaurant, authLoading, restaurantLoading, navigate]);

  if (authLoading || restaurantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) return null;

  const getMenuUrl = (tableId: string) => {
    return `${window.location.origin}/menu/${restaurant.slug}?table=${tableId}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Tables & QR Codes</h1>
            <p className="text-muted-foreground">Manage your tables and generate QR codes</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>

        {tables.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your restaurant tables to generate QR codes.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Table
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Table {table.table_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {table.capacity} guests
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${table.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                  </div>
                  
                  <div 
                    className="bg-muted rounded-xl p-4 mb-4 cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => setShowQRDialog(table)}
                  >
                    <div className="w-full aspect-square flex items-center justify-center">
                      <QRCodeSVG
                        value={getMenuUrl(table.id)}
                        size={120}
                        className="w-full h-full max-w-[120px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowQRDialog(table)}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      View QR
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTable(table)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (confirm('Delete this table?')) {
                          await deleteTable(table.id);
                          toast({ title: 'Table deleted' });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Table Dialog */}
        <TableDialog
          open={showAddDialog || !!editingTable}
          table={editingTable}
          onClose={() => {
            setShowAddDialog(false);
            setEditingTable(null);
          }}
          onSave={async (tableNumber, capacity) => {
            if (editingTable) {
              await updateTable(editingTable.id, { table_number: tableNumber, capacity });
              toast({ title: 'Table updated' });
            } else {
              await addTable(tableNumber, capacity);
              toast({ title: 'Table added' });
            }
          }}
        />

        {/* QR Code Dialog */}
        <QRCodeDialog
          table={showQRDialog}
          restaurantName={restaurant.name}
          menuUrl={showQRDialog ? getMenuUrl(showQRDialog.id) : ''}
          onClose={() => setShowQRDialog(null)}
        />
      </div>
    </DashboardLayout>
  );
};

interface TableDialogProps {
  open: boolean;
  table: RestaurantTable | null;
  onClose: () => void;
  onSave: (tableNumber: string, capacity: number) => Promise<void>;
}

const TableDialog = ({ open, table, onClose, onSave }: TableDialogProps) => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (table) {
      setTableNumber(table.table_number);
      setCapacity(table.capacity.toString());
    } else {
      setTableNumber('');
      setCapacity('4');
    }
  }, [table, open]);

  const handleSave = async () => {
    if (!tableNumber.trim()) return;
    setSaving(true);
    await onSave(tableNumber.trim(), parseInt(capacity) || 4);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? 'Edit Table' : 'Add Table'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Table Number/Name</Label>
            <Input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., 1, A1, Patio-1"
            />
          </div>
          <div>
            <Label>Capacity (guests)</Label>
            <Input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !tableNumber.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface QRCodeDialogProps {
  table: RestaurantTable | null;
  restaurantName: string;
  menuUrl: string;
  onClose: () => void;
}

const QRCodeDialog = ({ table, restaurantName, menuUrl, onClose }: QRCodeDialogProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    if (!qrRef.current || !table) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 50, 50, 300, 300);
        
        // Add text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(restaurantName, 200, 400);
        ctx.font = '18px sans-serif';
        ctx.fillText(`Table ${table.table_number}`, 200, 430);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Scan to view menu', 200, 460);
      }

      const link = document.createElement('a');
      link.download = `qr-table-${table.table_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!table) return null;

  return (
    <Dialog open={!!table} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Table {table.table_number}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div ref={qrRef} className="bg-muted rounded-2xl p-8">
            <QRCodeSVG
              value={menuUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-sm text-muted-foreground text-center break-all">
            {menuUrl}
          </p>
          <Button onClick={downloadQR} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardTables;
