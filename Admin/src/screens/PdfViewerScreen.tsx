import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PdfViewer } from '../components/common/PdfViewer';

export default function PdfViewerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { uri, title } = route.params || {};

  return (
    <PdfViewer
      uri={uri}
      title={title}
      onClose={() => navigation.goBack()}
    />
  );
}
