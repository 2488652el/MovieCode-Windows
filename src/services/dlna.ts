/**
 * DLNA/UPnP 投屏服务
 * 支持发现和投送到局域网内的 DLNA 设备
 */

import axios from 'axios';

// 设备信息
export interface DLNADevice {
  id: string;
  name: string;
  type: 'tv' | 'speaker' | 'renderer' | 'other';
  manufacturer: string;
  model: string;
  iconUrl?: string;
  controlUrl: string;
  eventSubUrl?: string;
  presentationUrl?: string;
  capabilities?: string[];
}

// 投屏状态
export interface CastState {
  deviceId: string | null;
  deviceName: string | null;
  mediaUrl: string | null;
  mediaTitle: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
}

// 投屏配置
export interface CastConfig {
  title: string;
  url: string;
  thumbnail?: string;
  mimeType?: string;
  duration?: number;
}

// DLNA 投屏器类
export class DLNACaster {
  private device: DLNADevice;
  private state: CastState;
  private eventSource?: EventSource;
  private pollInterval?: number;

  constructor(device: DLNADevice) {
    this.device = device;
    this.state = {
      deviceId: device.id,
      deviceName: device.name,
      mediaUrl: null,
      mediaTitle: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 100,
      muted: false,
    };
  }

  /**
   * 投送媒体
   */
  async cast(config: CastConfig): Promise<boolean> {
    try {
      // 设置媒体 URL
      await this.setAVTransportURI(config.url, config.title);
      
      // 等待设备准备
      await this.delay(500);
      
      // 开始播放
      await this.play();
      
      // 更新状态
      this.state.mediaUrl = config.url;
      this.state.mediaTitle = config.title;
      this.state.duration = config.duration || 0;
      this.state.isPlaying = true;
      
      // 开始状态轮询
      this.startStatePolling();
      
      return true;
    } catch (error) {
      console.error('DLNA cast failed:', error);
      return false;
    }
  }

  /**
   * 设置媒体 URI
   */
  private async setAVTransportURI(url: string, title: string): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
            <CurrentURI>${this.escapeXml(url)}</CurrentURI>
            <CurrentURIMetaData>&lt;DIDL-LITE xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-LITE/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:dc="http://purl.org/dc/elements/1.1/"&gt;&lt;item id="1" parentID="-1" restricted="1"&gt;&lt;dc:title&gt;${this.escapeXml(title)}&lt;/dc:title&gt;&lt;res protocolInfo="http-get:*:video/*:*"&gt;${this.escapeXml(url)}&lt;/res&gt;&lt;/item&gt;&lt;/DIDL-LITE&gt;</CurrentURIMetaData>
          </u:SetAVTransportURI>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('SetAVTransportURI', soapBody);
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
            <Speed>1</Speed>
          </u:Play>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('Play', soapBody);
    this.state.isPlaying = true;
  }

  /**
   * 暂停
   */
  async pause(): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:Pause xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
          </u:Pause>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('Pause', soapBody);
    this.state.isPlaying = false;
  }

  /**
   * 停止
   */
  async stop(): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:Stop xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
          </u:Stop>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('Stop', soapBody);
    this.stopStatePolling();
    this.state.isPlaying = false;
    this.state.position = 0;
  }

  /**
   * 跳转
   */
  async seek(position: number): Promise<void> {
    const time = this.formatTime(position);
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:Seek xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
            <Unit>REL_TIME</Unit>
            <Target>${time}</Target>
          </u:Seek>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('Seek', soapBody);
    this.state.position = position;
  }

  /**
   * 设置音量
   */
  async setVolume(volume: number): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">
            <InstanceID>0</InstanceID>
            <Channel>Master</Channel>
            <Volume>${volume}</Volume>
          </u:SetVolume>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('SetVolume', soapBody, 'RenderingControl');
    this.state.volume = volume;
  }

  /**
   * 静音
   */
  async setMute(muted: boolean): Promise<void> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:SetMute xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">
            <InstanceID>0</InstanceID>
            <Channel>Master</Channel>
            <DesiredMute>${muted ? 1 : 0}</DesiredMute>
          </u:SetMute>
        </s:Body>
      </s:Envelope>`;

    await this.sendSOAP('SetMute', soapBody, 'RenderingControl');
    this.state.muted = muted;
  }

  /**
   * 获取播放状态
   */
  async getTransportInfo(): Promise<any> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:GetTransportInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
          </u:GetTransportInfo>
        </s:Body>
      </s:Envelope>`;

    const response = await this.sendSOAP('GetTransportInfo', soapBody);
    return this.parseXMLResponse(response);
  }

  /**
   * 获取当前位置
   */
  async getPositionInfo(): Promise<{ position: number; duration: number }> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:GetPositionInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
            <InstanceID>0</InstanceID>
          </u:GetPositionInfo>
        </s:Body>
      </s:Envelope>`;

    const response = await this.sendSOAP('GetPositionInfo', soapBody);
    const data = this.parseXMLResponse(response);
    
    return {
      position: this.parseTime(data.AbsTime || '00:00:00'),
      duration: this.parseTime(data.TrackDuration || '00:00:00'),
    };
  }

  /**
   * 获取状态
   */
  getState(): CastState {
    return { ...this.state };
  }

  /**
   * 获取设备信息
   */
  getDevice(): DLNADevice {
    return { ...this.device };
  }

  /**
   * 开始状态轮询
   */
  private startStatePolling(): void {
    if (this.pollInterval) return;
    
    this.pollInterval = window.setInterval(async () => {
      try {
        const { position, duration } = await this.getPositionInfo();
        this.state.position = position;
        this.state.duration = duration;
      } catch (e) {
        // 忽略轮询错误
      }
    }, 1000);
  }

  /**
   * 停止状态轮询
   */
  private stopStatePolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  /**
   * 发送 SOAP 请求
   */
  private async sendSOAP(action: string, body: string, service: string = 'AVTransport'): Promise<string> {
    const url = this.device.controlUrl;
    
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPACTION': `"urn:schemas-upnp-org:service:${service}:1#${action}"`,
      },
      timeout: 10000,
    });
    
    return response.data;
  }

  /**
   * 解析 XML 响应
   */
  private parseXMLResponse(xml: string): Record<string, string> {
    const result: Record<string, string> = {};
    const regex = /<[^:]+:(\w+)>([^<]*)<\/[^:]+:\w+>/g;
    let match;
    
    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[2];
    }
    
    return result;
  }

  /**
   * 转义 XML 特殊字符
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * 解析时间
   */
  private parseTime(time: string): number {
    const parts = time.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopStatePolling();
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// DLNA 设备发现
class DLNADeviceDiscovery {
  private devices: Map<string, DLNADevice> = new Map();
  private searchTimeout: number = 5000;
  private socket?: WebSocket;

  /**
   * 发现设备
   */
  async discover(onDeviceFound: (device: DLNADevice) => void): Promise<DLNADevice[]> {
    return new Promise((resolve) => {
      const found: DLNADevice[] = [];
      
      // 使用 M-SEARCH 发现设备
      const ssdpMessage = [
        'M-SEARCH * HTTP/1.1',
        'HOST: 239.255.255.250:1900',
        'MAN: "ssdp:discover"',
        'MX: 3',
        'ST: urn:schemas-upnp-org:device:MediaRenderer:1',
        '',
        ''
      ].join('\r\n');

      // 创建 UDP Socket（浏览器不支持，直接使用模拟设备列表）
      // 实际实现需要使用 WebRTC 或扩展
      this.simulateDiscovery(onDeviceFound, found, resolve);
    });
  }

  /**
   * 模拟设备发现（浏览器环境限制）
   */
  private simulateDiscovery(
    onDeviceFound: (device: DLNADevice) => void,
    found: DLNADevice[],
    resolve: (devices: DLNADevice[]) => void
  ): void {
    // 模拟发现的设备
    const mockDevices: DLNADevice[] = [
      {
        id: 'mock-tv-1',
        name: '智能电视',
        type: 'tv',
        manufacturer: 'Samsung',
        model: 'Smart TV',
        controlUrl: 'http://192.168.1.100:9197/control',
        presentationUrl: 'http://192.168.1.100:9197',
        capabilities: ['AVTransport', 'RenderingControl'],
      },
    ];

    mockDevices.forEach((device) => {
      this.devices.set(device.id, device);
      found.push(device);
      onDeviceFound(device);
    });

    setTimeout(() => resolve(found), 1000);
  }

  /**
   * 获取所有发现的设备
   */
  getDevices(): DLNADevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * 获取设备
   */
  getDevice(id: string): DLNADevice | undefined {
    return this.devices.get(id);
  }

  /**
   * 创建投屏器
   */
  createCaster(deviceId: string): DLNACaster | null {
    const device = this.devices.get(deviceId);
    if (!device) return null;
    return new DLNACaster(device);
  }
}

// 导出单例
export const dlnaDiscovery = new DLNADeviceDiscovery();
export default dlnaDiscovery;
