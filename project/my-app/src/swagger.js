import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  return (
    <div>
      <h1>Documentación API</h1>
      <SwaggerUI 
        url={`${apiUrl}/swagger.json`}
      />
    </div>
  );
}