import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  FormControlLabel,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  ArrowBack as BackIcon,
  CheckCircle as FinalizeIcon,
  Replay as RevertIcon,
  ShoppingCart as ShoppingCartIcon,
  Code as XmlIcon,
  ContentCopy as CopyIcon,
  Receipt as InvoiceIcon,
  RemoveCircle as CreditNoteIcon,
  AddCircle as DebitNoteIcon,
  Description as ProformaIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';

import { GET_DOCUMENT_BY_ID, EXPORT_DOCUMENT_AS_UBL } from '../graphql/queries';
import { UPDATE_DOCUMENT_STATUS, CANCEL_DOCUMENT, REVERT_TO_DRAFT, SEND_DOCUMENT_BY_EMAIL, COPY_DOCUMENT } from '../graphql/mutations';
import { DocumentType, DocumentStatus } from '../types';
import PrintableDocument from '../components/PrintableDocument';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printableRef = useRef();
  const [printJob, setPrintJob] = useState({ isPrinting: false, isCopy: false });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [includeUblXml, setIncludeUblXml] = useState(true);  // По подразбиране включен за ERP интеграция
  const [emailSending, setEmailSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [copyMenuAnchor, setCopyMenuAnchor] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_DOCUMENT_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const [
    updateDocumentStatus,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_DOCUMENT_STATUS, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error updating document status:', error);
    },
  });

  const [cancelDocument, { loading: cancelLoading }] = useMutation(CANCEL_DOCUMENT, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error cancelling document:', error);
      alert('Грешка при анулиране: ' + error.message);
    },
  });

  const [revertToDraft, { loading: revertLoading }] = useMutation(REVERT_TO_DRAFT, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error reverting document to draft:', error);
      alert('Грешка при връщане в чернова: ' + error.message);
    },
  });

  const [sendDocumentByEmail] = useMutation(SEND_DOCUMENT_BY_EMAIL);

  const [copyDocument, { loading: copyLoading }] = useMutation(COPY_DOCUMENT, {
    onCompleted: (data) => {
      if (data?.copyDocument?.id) {
        setSnackbar({ open: true, message: 'Документът е копиран успешно', severity: 'success' });
        // Навигиране към новия документ
        navigate(`/documents/${data.copyDocument.id}`);
      }
    },
    onError: (error) => {
      console.error('Error copying document:', error);
      setSnackbar({ open: true, message: 'Грешка при копиране: ' + error.message, severity: 'error' });
    },
  });

  const [exportUbl, { loading: ublExporting }] = useLazyQuery(EXPORT_DOCUMENT_AS_UBL, {
    onCompleted: (result) => {
      if (result?.exportDocumentAsUbl?.success) {
        // Декодиране на Base64 XML от бекенда
        const base64Xml = result.exportDocumentAsUbl.xml;
        const decodedXml = decodeURIComponent(escape(window.atob(base64Xml))); // UTF-8 safe decode
        
        const filename = result.exportDocumentAsUbl.filename;
        const blob = new Blob([decodedXml], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = filename;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: 'UBL XML експортиран успешно', severity: 'success' });
      } else {
        setSnackbar({
          open: true,
          message: result?.exportDocumentAsUbl?.message || 'Грешка при експорт',
          severity: 'error'
        });
      }
    },
    onError: (error) => {
      setSnackbar({ open: true, message: 'Грешка при експорт: ' + error.message, severity: 'error' });
    }
  });

  useEffect(() => {
    if (printJob.isPrinting) {
      const input = printableRef.current;
      html2canvas(input, { scale: 1.5 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdf = new jspdf('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;

        if (height > pdfHeight) {
            let y = 0;
            while (y < height) {
                pdf.addImage(imgData, 'JPEG', 0, -y, width, height);
                y += pdfHeight;
                if (y < height) {
                    pdf.addPage();
                }
            }
        } else {
            pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        }
        
        pdf.save(`document-${document.fullDocumentNumber}${printJob.isCopy ? '-copy': ''}.pdf`);
        setPrintJob({ isPrinting: false, isCopy: false }); // Reset state
      });
    }
  }, [printJob, data]); 

  const handlePrint = (isCopy) => {
    setPrintJob({ isPrinting: true, isCopy });
  };

  const handleStatusChange = () => {
    const currentStatus = document.status;
    const newStatus =
      currentStatus === DocumentStatus.DRAFT
        ? DocumentStatus.FINAL
        : DocumentStatus.DRAFT;

    updateDocumentStatus({
      variables: {
        documentId: id,
        status: newStatus,
      },
    });
  };

  const handleCancelDocument = () => {
    const reason = window.prompt('Въведете причина за анулиране (незадължително):');
    if (reason !== null) {
      cancelDocument({
        variables: {
          documentId: id,
          reason: reason || null,
        },
      });
    }
  };

  const handleRevertToDraft = () => {
    if (window.confirm('Сигурни ли сте, че искате да върнете документа в чернова?')) {
      revertToDraft({
        variables: {
          documentId: id,
        },
      });
    }
  };

  const handleOpenEmailDialog = () => {
    // Попълване на имейла на клиента ако има
    if (data?.documentById?.client?.email) {
      setRecipientEmail(data.documentById.client.email);
    }
    setEmailDialogOpen(true);
  };

  const handleExportUbl = () => {
    exportUbl({ variables: { documentId: id } });
  };

  const handleCopyMenuOpen = (event) => {
    setCopyMenuAnchor(event.currentTarget);
  };

  const handleCopyMenuClose = () => {
    setCopyMenuAnchor(null);
  };

  const handleCopyDocument = (targetType) => {
    handleCopyMenuClose();
    copyDocument({
      variables: {
        input: {
          sourceDocumentId: id,
          targetDocumentType: targetType,
        },
      },
    });
  };

  const getCopyMenuItems = () => {
    const currentType = data?.documentById?.documentType;
    const items = [];

    // Фактура
    if (currentType !== DocumentType.INVOICE) {
      items.push({
        type: DocumentType.INVOICE,
        label: 'Копирай във Фактура',
        icon: <InvoiceIcon />,
      });
    }

    // Кредитно известие (само от фактура или дебитно)
    if (currentType === DocumentType.INVOICE || currentType === DocumentType.DEBIT_NOTE) {
      items.push({
        type: DocumentType.CREDIT_NOTE,
        label: 'Копирай в Кредитно известие',
        icon: <CreditNoteIcon color="error" />,
        hint: 'Количествата ще бъдат с минус',
      });
    }

    // Дебитно известие (само от фактура)
    if (currentType === DocumentType.INVOICE) {
      items.push({
        type: DocumentType.DEBIT_NOTE,
        label: 'Копирай в Дебитно известие',
        icon: <DebitNoteIcon color="success" />,
      });
    }

    // Проформа
    if (currentType !== DocumentType.PROFORMA) {
      items.push({
        type: DocumentType.PROFORMA,
        label: 'Копирай в Проформа',
        icon: <ProformaIcon />,
      });
    }

    // Дублиране (същия тип)
    items.push({
      type: currentType,
      label: 'Дублирай документа',
      icon: <CopyIcon />,
    });

    return items;
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSnackbar({ open: true, message: 'Моля, въведете валиден имейл адрес', severity: 'error' });
      return;
    }

    setEmailSending(true);

    try {
      // Генериране на PDF
      const input = printableRef.current;
      const canvas = await html2canvas(input, { scale: 1.5 });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jspdf('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      if (height > pdfHeight) {
        let y = 0;
        while (y < height) {
          pdf.addImage(imgData, 'JPEG', 0, -y, width, height);
          y += pdfHeight;
          if (y < height) {
            pdf.addPage();
          }
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      }

      // Конвертиране в base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // Изпращане на имейл (с или без UBL XML)
      const { data: emailResult } = await sendDocumentByEmail({
        variables: {
          input: {
            documentId: id,
            recipientEmail: recipientEmail,
            pdfBase64: pdfBase64,
            includeUblXml: includeUblXml,
          },
        },
      });

      if (emailResult?.sendDocumentByEmail?.success) {
        setSnackbar({ open: true, message: emailResult.sendDocumentByEmail.message, severity: 'success' });
        setEmailDialogOpen(false);
        setRecipientEmail('');
        setIncludeUblXml(true);  // Reset to default
      } else {
        setSnackbar({
          open: true,
          message: emailResult?.sendDocumentByEmail?.message || 'Грешка при изпращане',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({ open: true, message: 'Грешка при изпращане: ' + error.message, severity: 'error' });
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Грешка при зареждане на документа: {error.message}
      </Alert>
    );
  }

  if (!data?.documentById) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Документът не е намерен
      </Alert>
    );
  }

  const document = data.documentById;
  const documentItems = document.documentItems || [];
  const totalVatAmount = documentItems.reduce((acc, item) => acc + (item.vatAmount || 0), 0);
  const subTotalAmount = document.totalAmountWithVat - totalVatAmount;

  const getStatusColor = (status) => {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'warning';
      case DocumentStatus.FINAL:
        return 'success';
      case DocumentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'Чернова';
      case DocumentStatus.FINAL:
        return 'Приключен';
      case DocumentStatus.CANCELLED:
        return 'Анулиран';
      default:
        return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case DocumentType.INVOICE:
        return 'Фактура';
      case DocumentType.CREDIT_NOTE:
        return 'Кредитно известие';
      case DocumentType.DEBIT_NOTE:
        return 'Дебитно известие';
      case DocumentType.PROFORMA:
        return 'Проформа фактура';
      default:
        return type;
    }
  };

  const InfoRow = ({
    label,
    value,
  }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
      <Typography variant="body2" color="text.secondary" component="div">
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight="medium" component="div">
        {value}
      </Typography>
    </Box>
  );

  const isDraft = document.status === DocumentStatus.DRAFT;

  return (
    <Box>
       <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
         <PrintableDocument ref={printableRef} document={document} isCopy={printJob.isCopy} />
       </div>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/documents')}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {getTypeLabel(document.documentType)} {document.fullDocumentNumber}
        </Typography>
        <Chip
          label={getStatusLabel(document.status)}
          color={getStatusColor(document.status)}
          size="small"
        />
      </Box>

      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Грешка при промяна на статуса: {updateError.message}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Действия */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Действия
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {/* Бутон за финализиране/връщане в чернова - само за DRAFT и FINAL */}
              {document.status !== DocumentStatus.CANCELLED && (
                <Button
                  variant="contained"
                  color={isDraft ? 'success' : 'warning'}
                  startIcon={isDraft ? <FinalizeIcon /> : <RevertIcon />}
                  onClick={handleStatusChange}
                  disabled={updateLoading || printJob.isPrinting}
                >
                  {isDraft ? 'Финализирай' : 'Върни в чернова'}
                </Button>
              )}
              {/* Бутон за анулиране - само за FINAL документи */}
              {document.status === DocumentStatus.FINAL && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancelDocument}
                  disabled={cancelLoading || printJob.isPrinting}
                >
                  Анулирай
                </Button>
              )}
              {/* Бутон за връщане в чернова - само за CANCELLED документи */}
              {document.status === DocumentStatus.CANCELLED && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<RevertIcon />}
                  onClick={handleRevertToDraft}
                  disabled={revertLoading || printJob.isPrinting}
                >
                  Върни в чернова
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrint(false)}
                disabled={isDraft || printJob.isPrinting}
              >
                Принтирай
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handlePrint(true)}
                disabled={isDraft || printJob.isPrinting}
              >
                Принтирай Копие
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={handleOpenEmailDialog}
                disabled={isDraft || emailSending}
              >
                Изпрати по имейл
              </Button>
              <Button
                variant="outlined"
                startIcon={<XmlIcon />}
                onClick={handleExportUbl}
                disabled={isDraft || ublExporting}
                title="Експорт като UBL 2.1 XML (EN 16931 / Peppol)"
              >
                {ublExporting ? 'Експортиране...' : 'UBL XML'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyMenuOpen}
                disabled={copyLoading || document.status === DocumentStatus.CANCELLED}
                title="Копирай в друг тип документ"
              >
                {copyLoading ? 'Копиране...' : 'Копирай'}
              </Button>
              <Menu
                anchorEl={copyMenuAnchor}
                open={Boolean(copyMenuAnchor)}
                onClose={handleCopyMenuClose}
              >
                {getCopyMenuItems().map((item) => (
                  <MenuItem
                    key={item.type}
                    onClick={() => handleCopyDocument(item.type)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.hint}
                    />
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
            {/* Показване на информация за анулиране */}
            {document.status === DocumentStatus.CANCELLED && document.cancellationReason && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <strong>Причина за анулиране:</strong> {document.cancellationReason}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Основна информация */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Основна информация
            </Typography>
            <InfoRow label="Номер" value={document.fullDocumentNumber} />
            <InfoRow label="Тип документ" value={getTypeLabel(document.documentType)} />
            <InfoRow label="Статус" value={
              <Chip
                label={getStatusLabel(document.status)}
                color={getStatusColor(document.status)}
                size="small"
              />
            } />
            <InfoRow 
              label="Дата на издаване" 
              value={new Date(document.issueDate).toLocaleDateString('bg-BG')} 
            />
            {document.vatDate && (
              <InfoRow 
                label="VAT дата" 
                value={new Date(document.vatDate).toLocaleDateString('bg-BG')} 
              />
            )}
            <InfoRow 
              label="Срок за плащане" 
              value={new Date(document.dueDate).toLocaleDateString('bg-BG')} 
            />
          </CardContent>
        </Card>

        {/* Информация за клиента */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Клиент
            </Typography>
            <InfoRow label="Име" value={document.client.name} />
            {document.client.address && (
              <InfoRow label="Адрес" value={document.client.address} />
            )}
            {document.client.vatNumber && (
              <InfoRow label="ДДС номер" value={document.client.vatNumber} />
            )}
          </CardContent>
        </Card>

        {/* Артикули */}
        {documentItems && documentItems.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                Артикули
              </Typography>
              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Описание</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Количество</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ед. цена</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>ДДС %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Сума</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documentItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemDescription || item.effectiveItemName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.vatRate.toFixed(2)}%</TableCell>
                        <TableCell align="right">{item.lineTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
        </Card>
        )}

        {/* Totals */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Общо
            </Typography>
            <InfoRow 
              label="Междинна сума" 
              value={`${subTotalAmount.toFixed(2)} ${document.currencyCode}`} 
            />
            <InfoRow 
              label="ДДС" 
              value={`${totalVatAmount.toFixed(2)} ${document.currencyCode}`} 
            />
            <Divider sx={{ my: 1 }} />
            <InfoRow 
              label={<Typography fontWeight="bold">Обща сума</Typography>} 
              value={<Typography fontWeight="bold">{`${document.totalAmountWithVat.toFixed(2)} ${document.currencyCode}`}</Typography>} 
            />
          </CardContent>
        </Card>
        
        {/* Информация за фирмата */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Фирма
            </Typography>
            <InfoRow label="Име" value={document.company.name} />
            {document.company.address && (
              <InfoRow label="Адрес" value={document.company.address} />
            )}
            {document.company.vatNumber && (
              <InfoRow label="ДДС номер" value={document.company.vatNumber} />
            )}
          </CardContent>
        </Card>

      </Stack>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => !emailSending && setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Изпрати документ по имейл</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Имейл адрес на получателя"
            type="email"
            fullWidth
            variant="outlined"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={emailSending}
            sx={{ mt: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={includeUblXml}
                onChange={(e) => setIncludeUblXml(e.target.checked)}
                disabled={emailSending}
                color="primary"
              />
            }
            label="Прикачи UBL XML за ERP интеграция"
            sx={{ mt: 2, display: 'block' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
            UBL XML файлът може да бъде импортиран директно в ERP системи (EN 16931 / Peppol формат)
          </Typography>
          {emailSending && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Генериране на PDF{includeUblXml ? ' и UBL XML' : ''} и изпращане...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>
            Отказ
          </Button>
          <Button onClick={handleSendEmail} variant="contained" disabled={emailSending}>
            {emailSending ? 'Изпращане...' : 'Изпрати'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentDetail;