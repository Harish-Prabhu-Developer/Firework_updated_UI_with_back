import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockInvalidateQueries = jest.fn();
const mockApiPost = jest.fn();
const mockApiGet = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [{ id: 'cat1', name: 'General' }],
    isLoading: false,
  })),
  useQueryClient: jest.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

jest.mock('../../src/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

jest.mock('../../src/api/api', () => ({
  get: (...args: any[]) => mockApiGet(...args),
  post: (...args: any[]) => mockApiPost(...args),
}));

jest.mock('../../src/components/modals/FormModal', () => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native');
  const MockFormModal = ({ open, onClose, title, footer, children }: any) =>
    open ? (
      <View>
        <View testID="modal-title">{title}</View>
        <ScrollView>{children}</ScrollView>
        <View testID="modal-footer">{footer}</View>
      </View>
    ) : null;
  return { FormModal: MockFormModal };
});

jest.mock('../../src/components/ui/Select', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  const MockSelect = ({ label, value, options, onValueChange }: any) => (
    <View>
      <Text testID="select-label">{label}</Text>
      {options.map((o: any) => (
        <TouchableOpacity key={o.value} onPress={() => onValueChange(o.value)} testID={`select-${o.value}`}>
          <Text>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  return { Select: MockSelect };
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    Upload: (props: any) => <View testID="icon-upload" />,
    Download: (props: any) => <View testID="icon-download" />,
    Save: (props: any) => <View testID="icon-save" />,
    X: (props: any) => <View testID="icon-x" />,
    FileText: (props: any) => <View testID="icon-file-text" />,
    CheckCircle: (props: any) => <View testID="icon-check-circle" />,
    XCircle: (props: any) => <View testID="icon-x-circle" />,
    AlertTriangle: (props: any) => <View testID="icon-alert-triangle" />,
  };
});

jest.mock('../../src/styles/colors', () => ({
  LightColors: {
    foreground: '#000',
    mutedForeground: '#666',
    card: '#fff',
    muted: '#f5f5f5',
    border: '#e0e0e0',
    primary: '#276741',
    primarySoft: '#e8f2ec',
    primaryForeground: '#fff',
    destructive: '#dc2626',
    success: '#16803c',
    successSoft: '#e8f7ee',
    warning: '#b45309',
    warningSoft: '#fff4de',
  },
}));

jest.mock('../../src/styles/globalStyles', () => ({
  Radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, full: 999 },
  Fonts: { display: 'System', body: 'System' },
}));

import BulkUploadDialog, { parseCSV } from '../../src/screens/BulkUploadDialog';

describe('BulkUploadDialog', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { data: [] } });
  });

  it('renders when open is true', async () => {
    await render(<BulkUploadDialog open={true} onClose={onClose} />);
    expect(screen.getByText('Bulk Product Upload')).toBeTruthy();
    expect(screen.getByText('Step 1: Download Template')).toBeTruthy();
    expect(screen.getByText('Step 3: Upload Completed Template')).toBeTruthy();
  });

  it('does not render when open is false', async () => {
    await render(<BulkUploadDialog open={false} onClose={onClose} />);
    expect(screen.queryByText('Bulk Product Upload')).toBeNull();
  });

  it('shows file upload button and category select', async () => {
    await render(<BulkUploadDialog open={true} onClose={onClose} />);
    expect(screen.getByText('Choose CSV File')).toBeTruthy();
    expect(screen.getByTestId('select-label')).toBeTruthy();
  });

  it('shows cancel and upload buttons in footer', async () => {
    await render(<BulkUploadDialog open={true} onClose={onClose} />);
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Upload')).toBeTruthy();
  });

  it('shows category options from query data', async () => {
    await render(<BulkUploadDialog open={true} onClose={onClose} />);
    expect(screen.getByText('General')).toBeTruthy();
  });

  it('calls onClose and resets state when close triggered', async () => {
    const close = jest.fn();
    const { rerender } = await render(<BulkUploadDialog open={true} onClose={close} />);
    // Rerender with open=false to simulate FormModal close
    await rerender(<BulkUploadDialog open={false} onClose={close} />);
    expect(screen.queryByText('Bulk Product Upload')).toBeNull();
  });

  it('shows downloading state when download template pressed', async () => {
    await render(<BulkUploadDialog open={true} onClose={onClose} />);
    const downloadBtn = screen.getByText('Download Product Bulk Upload Template');
    fireEvent.press(downloadBtn);
    expect(mockToast.success).toHaveBeenCalledWith('Template downloaded');
  });
});

describe('parseCSV', () => {
  it('parses CSV with empty productCode correctly without column shift', () => {
    const csv =
      'productCode,name,description,mrp,productDiscount,stock,tag,unit,perQty,status,image\n' +
      ',Ground Chakkar Normal,Traditional spinning firework,50,35,50,Popular,Box,10,Active,\n' +
      ',Ground Chakkar Deluxe,Larger spin with bright sparks,90,70,50,Trending,Box,10,Active,';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].productCode).toBe('');
    expect(rows[0].name).toBe('Ground Chakkar Normal');
    expect(rows[0].description).toBe('Traditional spinning firework');
    expect(rows[0].mrp).toBe('50');
    expect(rows[0].productDiscount).toBe('35');
    expect(rows[0].stock).toBe('50');
    expect(rows[0].tag).toBe('Popular');
    expect(rows[0].unit).toBe('Box');
    expect(rows[0].perQty).toBe('10');
    expect(rows[0].status).toBe('Active');
    expect(rows[1].name).toBe('Ground Chakkar Deluxe');
  });

  it('handles quoted fields with commas', () => {
    const csv =
      'productCode,name,description,mrp,productDiscount,stock,tag,unit,perQty,status,image\n' +
      'CK100,"Test, Product",Desc,100,80,50,Trending,PCS,10,Active,';
    const rows = parseCSV(csv);
    expect(rows[0].name).toBe('Test, Product');
  });

  it('handles trailing comma (empty image field)', () => {
    const csv =
      'productCode,name,description,mrp,productDiscount,stock,tag,unit,perQty,status,image\n' +
      'CK100,Test,Desc,100,80,50,Trending,PCS,10,Active,';
    const rows = parseCSV(csv);
    expect(rows[0].image).toBe('');
  });
});
