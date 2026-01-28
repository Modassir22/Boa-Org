import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Trash2, Eye, Download, Award } from 'lucide-react';
import { exportToCSV, formatRegistrationForExport } from '@/lib/exportUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AddCertificateModal from '@/components/admin/AddCertificateModal';

// Helper function to convert delegate_type to readable format
const formatDelegateType = (delegateType: string, categoryName?: string) => {
  // If we have the original category name, use that
  if (categoryName) {
    return categoryName;
  }
  
  // Fallback to mapping delegate_type
  const typeMap: { [key: string]: string } = {
    'life-member': 'Life Member',
    'non-boa-member': 'Non BOA Member',
    'accompanying-person': 'Accompanying Person'
  };
  return typeMap[delegateType] || delegateType;
};

// Helper function to format title consistently
const formatTitle = (title: string) => {
  const titleMap: { [key: string]: string } = {
    'dr': 'Dr.',
    'mr': 'Mr.',
    'mrs': 'Mrs.',
    'ms': 'Ms.',
    'prof': 'Prof.'
  };
  return titleMap[title?.toLowerCase()] || title || '';
};

export default function RegistrationsTab() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const response = await adminAPI.getAllRegistrations();
      setRegistrations(response.registrations || []);
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const formattedData = formatRegistrationForExport(registrations);
    exportToCSV(formattedData, 'export_user_registration');
    toast({
      title: 'Success',
      description: `Exported ${registrations.length} registrations to CSV`,
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminAPI.updateRegistrationStatus(id, status);
      toast({ title: 'Success', description: 'Status updated successfully' });
      loadRegistrations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Update failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    try {
      await adminAPI.deleteRegistration(id);
      toast({ title: 'Success', description: 'Registration deleted successfully' });
      loadRegistrations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (reg: any) => {
    setSelectedRegistration(reg);
    setIsDetailsOpen(true);
  };

  const handleAddCertificate = (userId: number) => {
    setSelectedUserId(userId);
    setIsCertificateModalOpen(true);
  };

  const generatePDF = (reg: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(26, 127, 127);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Ophthalmic Association of Bihar', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Ved Vani, East Shivpuri, Chitkohara Bypass Road', 105, 22, { align: 'center' });
    doc.text('Po-Anishabad, Patna - 800002', 105, 27, { align: 'center' });
    doc.text('Reg No: S000403 | Certificate No: S22104', 105, 32, { align: 'center' });
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMINAR REGISTRATION DETAILS', 105, 50, { align: 'center' });
    
    // Registration Info
    let y = 65;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Registration Information', 20, y);
    
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const regInfo = [
      ['Registration No:', reg.registration_no],
      ['Registration Date:', new Date(reg.created_at).toLocaleString()],
      ['Status:', reg.status.toUpperCase()],
      ['Payment Method:', reg.payment_method || 'N/A'],
      ['Transaction ID:', reg.transaction_id || 'N/A'],
      ['Payment Date:', reg.payment_date ? new Date(reg.payment_date).toLocaleString() : 'N/A']
    ];
    
    regInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 70, y);
      y += 6;
    });
    
    // Participant Details
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Participant Details', 20, y);
    
    y += 8;
    doc.setFontSize(10);
    const participantInfo = [
      ['Name:', `${formatTitle(reg.title)} ${reg.first_name} ${reg.surname}`],
      ['Email:', reg.email],
      ['Mobile:', reg.mobile],
      ['Gender:', reg.gender],
      ['Membership No:', reg.membership_no || 'N/A'],
      ['Delegate Type:', formatDelegateType(reg.delegate_type, reg.category_name) || 'Self']
    ];
    
    participantInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 70, y);
      y += 6;
    });
    
    // Seminar Details
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Seminar Details', 20, y);
    
    y += 8;
    doc.setFontSize(10);
    const seminarInfo = [
      ['Seminar Name:', reg.seminar_name],
      ['Location:', reg.seminar_location],
      ['Category:', reg.category_name],
      ['Fee Slab:', reg.slab_label]
    ];
    
    seminarInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 70, y);
      y += 6;
    });
    
    // Additional Persons
    if (reg.additional_persons && reg.additional_persons.length > 0) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Additional Delegates', 20, y);
      
      y += 8;
      doc.setFontSize(10);
      
      reg.additional_persons.forEach((person: any, index: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${person.name}`, 20, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Category: ${person.category_name} | Slab: ${person.slab_label} | Amount: Rs ${parseFloat(person.amount).toLocaleString()}`, 25, y);
        y += 6;
      });
    }
    
    // Fee Summary
    y += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 3, 180, 25, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Fee Summary', 20, y + 3);
    
    y += 10;
    doc.setFontSize(10);
    doc.text('Registration Amount:', 20, y);
    doc.text(`Rs ${parseFloat(reg.amount).toLocaleString()}`, 150, y, { align: 'right' });
    
    if (reg.additional_persons && reg.additional_persons.length > 0) {
      const additionalTotal = reg.additional_persons.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      y += 6;
      doc.text('Additional Delegates:', 20, y);
      doc.text(`Rs ${additionalTotal.toLocaleString()}`, 150, y, { align: 'right' });
    }
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', 20, y);
    doc.text(`Rs ${parseFloat(reg.amount).toLocaleString()}`, 150, y, { align: 'right' });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated document. No signature required.', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    doc.save(`BOA_Registration_${reg.registration_no}.pdf`);
    
    toast({
      title: 'PDF Downloaded',
      description: 'Registration details saved as PDF',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Registrations Management</h2>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Seminar</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Delegate Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell className="font-medium">{reg.registration_no}</TableCell>
                <TableCell>{formatTitle(reg.title)} {reg.first_name} {reg.surname}</TableCell>
                <TableCell className="text-sm">{reg.seminar_name}</TableCell>
                <TableCell className="text-sm">{reg.category_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {formatDelegateType(reg.delegate_type, reg.category_name) || 'Self'}
                  </Badge>
                </TableCell>
                <TableCell>Rs {parseFloat(reg.amount).toLocaleString()}</TableCell>
                <TableCell>
                  {reg.status === 'completed' && reg.payment_method === 'razorpay' ? (
                    // If payment is completed via Razorpay, show read-only badge
                    <Badge 
                      className={`capitalize ${
                        reg.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        reg.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {reg.status} ✓
                    </Badge>
                  ) : (
                    // For other statuses, allow editing
                    <Select value={reg.status} onValueChange={(value) => handleStatusChange(reg.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-sm">{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(reg)} title="View Details">
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => generatePDF(reg)} title="Download PDF">
                      <Download className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAddCertificate(reg.user_id)} title="Add Certificate">
                      <Award className="h-4 w-4 text-amber-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(reg.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Registration Info */}
              <div className="bg-accent/30 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center justify-between">
                  Registration Information
                  <Button size="sm" onClick={() => generatePDF(selectedRegistration)} className="gradient-primary">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">Registration No:</span> {selectedRegistration.registration_no}</div>
                  <div><span className="font-semibold">Date:</span> {new Date(selectedRegistration.created_at).toLocaleString()}</div>
                  <div><span className="font-semibold">Status:</span> <Badge className="capitalize">{selectedRegistration.status}</Badge></div>
                  <div><span className="font-semibold">Payment Method:</span> {selectedRegistration.payment_method || 'N/A'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Transaction ID:</span> {selectedRegistration.transaction_id || 'N/A'}</div>
                  {selectedRegistration.payment_date && (
                    <div className="md:col-span-2"><span className="font-semibold">Payment Date:</span> {new Date(selectedRegistration.payment_date).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Participant Details */}
              <div className="bg-accent/30 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Participant Details</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">Name:</span> {formatTitle(selectedRegistration.title)} {selectedRegistration.first_name} {selectedRegistration.surname}</div>
                  <div><span className="font-semibold">Email:</span> {selectedRegistration.email}</div>
                  <div><span className="font-semibold">Mobile:</span> {selectedRegistration.mobile}</div>
                  <div><span className="font-semibold">Gender:</span> {selectedRegistration.gender}</div>
                  <div><span className="font-semibold">Membership No:</span> {selectedRegistration.membership_no || 'N/A'}</div>
                  <div><span className="font-semibold">Delegate Type:</span> {formatDelegateType(selectedRegistration.delegate_type, selectedRegistration.category_name) || 'Self'}</div>
                </div>
              </div>

              {/* Seminar Details */}
              <div className="bg-accent/30 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Seminar Details</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="md:col-span-2"><span className="font-semibold">Seminar:</span> {selectedRegistration.seminar_name}</div>
                  <div><span className="font-semibold">Location:</span> {selectedRegistration.seminar_location}</div>
                  <div><span className="font-semibold">Category:</span> {selectedRegistration.category_name}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Fee Slab:</span> {selectedRegistration.slab_label}</div>
                </div>
              </div>

              {/* Additional Persons */}
              {selectedRegistration.additional_persons && selectedRegistration.additional_persons.length > 0 && (
                <div className="bg-accent/30 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Additional Delegates</h3>
                  <div className="space-y-3">
                    {selectedRegistration.additional_persons.map((person: any, index: number) => (
                      <div key={index} className="border-l-4 border-primary pl-3 py-2">
                        <div className="font-semibold">{person.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {person.category_name} • {person.slab_label} • Rs {parseFloat(person.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Summary */}
              <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary">
                <h3 className="font-semibold text-lg mb-3">Fee Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Registration Amount:</span>
                    <span className="font-semibold">Rs {parseFloat(selectedRegistration.amount).toLocaleString()}</span>
                  </div>
                  {selectedRegistration.additional_persons && selectedRegistration.additional_persons.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Additional Delegates:</span>
                        <span className="font-semibold">
                          Rs {selectedRegistration.additional_persons.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-base font-bold">
                        <span>Grand Total:</span>
                        <span>Rs {parseFloat(selectedRegistration.amount).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Certificate Modal */}
      {selectedUserId && (
        <AddCertificateModal
          isOpen={isCertificateModalOpen}
          onClose={() => {
            setIsCertificateModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          onSuccess={loadRegistrations}
        />
      )}
    </div>
  );
}
