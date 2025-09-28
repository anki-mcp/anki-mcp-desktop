import { Injectable, Scope } from '@nestjs/common';
import { Resource, ResourceTemplate } from '@rekog/mcp-nest';
import * as os from 'os';

@Injectable({ scope: Scope.REQUEST })
export class SystemInfoResource {
  @Resource({
    name: 'system-info',
    description: 'Current system information and environment',
    mimeType: 'application/json',
    uri: 'system://info',
  })
  getSystemInfo({ uri }: { uri: string }) {
    const systemInfo = {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
      uptime: `${Math.round(os.uptime() / 3600)} hours`,
      hostname: os.hostname(),
      nodeVersion: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
    };

    return {
      contents: [
        {
          uri: uri,
          mimeType: 'application/json',
          text: JSON.stringify(systemInfo, null, 2),
        },
      ],
    };
  }

  @ResourceTemplate({
    name: 'environment-variable',
    description: 'Get a specific environment variable',
    mimeType: 'text/plain',
    uriTemplate: 'env://{name}',
  })
  getEnvironmentVariable({ uri, name }: { uri: string; name: string }) {
    const value = process.env[name.toUpperCase()] || 'undefined';

    return {
      contents: [
        {
          uri: uri,
          mimeType: 'text/plain',
          text: value,
        },
      ],
    };
  }
}
