import { useState } from 'react';
import { API_BASE_URL } from '@/lib/utils';

export function ApiTest() {
  const [testResult, setTestResult] = useState<string>('');

  const testApi = async () => {
    try {
      console.log('Testing API at:', API_BASE_URL);
      setTestResult('Testing...');
      
      // Test basic connectivity
      const response = await fetch(`${API_BASE_URL}/api/committee-members?page_type=home`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 500));
      
      setTestResult(`Status: ${response.status}\nContent-Type: ${response.headers.get('content-type')}\nResponse: ${responseText.substring(0, 200)}...`);
    } catch (error) {
      console.error('API Test Error:', error);
      setTestResult(`Error: ${error}`);
    }
  };

  const testPdfGeneration = async () => {
    try {
      console.log('Testing PDF generation at:', `${API_BASE_URL}/api/generate-seminar-pdf/8`);
      setTestResult('Testing PDF generation...');
      
      // Check if user is authenticated for testing
      const token = localStorage.getItem('token');
      if (!token) {
        setTestResult('PDF Test Error: Authentication required. Please login first.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/generate-seminar-pdf/8`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('PDF Response status:', response.status);
      console.log('PDF Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('PDF Error response:', errorText);
        setTestResult(`PDF Error - Status: ${response.status}\nResponse: ${errorText.substring(0, 300)}...`);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      setTestResult(`PDF Success!\nStatus: ${response.status}\nContent-Type: ${contentType}\nContent-Length: ${contentLength}`);
    } catch (error) {
      console.error('PDF Test Error:', error);
      setTestResult(`PDF Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>API Test</h3>
      <p><strong>Current API Base URL:</strong> {API_BASE_URL}</p>
      <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      <p><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL}</p>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={testApi} style={{ marginRight: '10px' }}>Test API Connection</button>
        <button onClick={testPdfGeneration}>Test PDF Generation</button>
      </div>
      
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
        {testResult}
      </pre>
    </div>
  );
}