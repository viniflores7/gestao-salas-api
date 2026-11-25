import { createApp } from './app.ts';
import { environment } from './config/environment.ts';

createApp().listen(environment.port, () => {
  console.log(`API listening on http://localhost:${environment.port}`);
});
