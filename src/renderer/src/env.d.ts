import type { ClaudeApi } from '../../shared/api';

declare global {
  interface Window {
    claude: ClaudeApi;
  }
}
