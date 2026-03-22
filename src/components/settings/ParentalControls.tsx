import { useState } from 'react';
import { useParentalControlsStore } from '@/stores';
import { CONTENT_RATING_CONFIG, type ContentRating, type MediaType } from '@/types';

// 家长控制设置组件
export default function ParentalControls() {
  const {
    settings,
    isUnlocked,
    setEnabled,
    setPin,
    verifyPin,
    setContentRating,
    blockGenre,
    unblockGenre,
    setAllowedMediaTypes,
    setDailyWatchLimit,
    isParentalUnlocked,
    unlockTemporarily,
    lock,
  } = useParentalControlsStore();

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // 处理 PIN 输入
  const handlePinInput = (digit: string) => {
    if (pinInput.length < 4) {
      const newPinInput = pinInput + digit;
      setPinInput(newPinInput);

      if (newPinInput.length === 4) {
        if (isChangingPin) {
          // 验证旧 PIN
          if (!verifyPin(newPinInput)) {
            setPinError('PIN 错误');
            setPinInput('');
            return;
          }
          setPinError('');
          setPinInput('');
          // 要求输入新 PIN
          setIsChangingPin(false);
        } else if (isParentalUnlocked()) {
          // 已解锁，直接锁定
          lock();
          setShowPinDialog(false);
          setPinInput('');
        } else {
          // 验证 PIN
          if (verifyPin(newPinInput)) {
            unlockTemporarily(30 * 60 * 1000); // 解锁 30 分钟
            setShowPinDialog(false);
            setPinInput('');
          } else {
            setPinError('PIN 错误');
            setPinInput('');
          }
        }
      }
    }
  };

  // 处理新 PIN 确认
  const handleNewPinConfirm = () => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('请输入4位数字');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('两次输入不一致');
      return;
    }
    setPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setIsChangingPin(false);
    setPinError('');
  };

  // 处理解锁/锁定
  const handleToggleLock = () => {
    if (isParentalUnlocked()) {
      lock();
    } else {
      setShowPinDialog(true);
      setPinInput('');
      setPinError('');
    }
  };

  // 媒体类型选项
  const mediaTypeOptions: { value: MediaType; label: string }[] = [
    { value: 'movie', label: '电影' },
    { value: 'tv', label: '剧集' },
    { value: 'anime', label: '动漫' },
  ];

  // 处理媒体类型切换
  const handleMediaTypeToggle = (type: MediaType) => {
    const current = settings.allowedMediaTypes;
    if (current.includes(type)) {
      if (current.length > 1) {
        setAllowedMediaTypes(current.filter(t => t !== type));
      }
    } else {
      setAllowedMediaTypes([...current, type]);
    }
  };

  return (
    <div className="parental-controls">
      {/* 头部 */}
      <div className="settings-header">
        <h2>家长控制</h2>
        <p className="settings-description">
          设置家长控制，保护未成年人观看不适合的内容
        </p>
      </div>

      {/* 启用开关 */}
      <div className="setting-item">
        <div className="setting-info">
          <h3>启用家长控制</h3>
          <p>开启后将根据设置过滤和限制内容</p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* PIN 保护 */}
      <div className="setting-item">
        <div className="setting-info">
          <h3>PIN 保护</h3>
          <p>
            {isParentalUnlocked()
              ? '已解锁，点击锁定'
              : '需要输入 PIN 才能访问受限制内容'}
          </p>
        </div>
        <button
          className={`pin-button ${isParentalUnlocked() ? 'locked' : ''}`}
          onClick={handleToggleLock}
        >
          {isParentalUnlocked() ? '🔒 锁定' : '🔓 解锁'}
        </button>
      </div>

      {/* 修改 PIN */}
      {isParentalUnlocked() && (
        <div className="setting-item">
          <div className="setting-info">
            <h3>修改 PIN</h3>
            <p>更改访问家长控制的密码</p>
          </div>
          <button
            className="action-button secondary"
            onClick={() => {
              setIsChangingPin(true);
              setShowPinDialog(true);
              setPinInput('');
              setPinError('');
            }}
          >
            修改 PIN
          </button>
        </div>
      )}

      {/* 年龄分级 */}
      <div className="setting-item vertical">
        <div className="setting-info">
          <h3>年龄分级限制</h3>
          <p>允许观看的最高内容分级</p>
        </div>
        <div className="rating-options">
          {(Object.keys(CONTENT_RATING_CONFIG) as ContentRating[]).map((rating) => (
            <label
              key={rating}
              className={`rating-option ${settings.contentRating === rating ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="contentRating"
                value={rating}
                checked={settings.contentRating === rating}
                onChange={() => setContentRating(rating)}
              />
              <span className="rating-label">
                {CONTENT_RATING_CONFIG[rating].label}
              </span>
              <span className="rating-desc">
                {CONTENT_RATING_CONFIG[rating].description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 媒体类型 */}
      <div className="setting-item vertical">
        <div className="setting-info">
          <h3>允许的媒体类型</h3>
          <p>选择允许观看的媒体类型</p>
        </div>
        <div className="media-type-options">
          {mediaTypeOptions.map((option) => (
            <label key={option.value} className="checkbox-option">
              <input
                type="checkbox"
                checked={settings.allowedMediaTypes.includes(option.value)}
                onChange={() => handleMediaTypeToggle(option.value)}
              />
              <span className="checkbox-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 每日观看时长 */}
      <div className="setting-item vertical">
        <div className="setting-info">
          <h3>每日观看时长限制</h3>
          <p>设置每天允许观看的时间（0表示不限制）</p>
        </div>
        <div className="time-limit-input">
          <input
            type="number"
            min="0"
            max="1440"
            value={settings.dailyWatchLimit}
            onChange={(e) => setDailyWatchLimit(parseInt(e.target.value) || 0)}
          />
          <span>分钟/天</span>
        </div>
      </div>

      {/* PIN 输入对话框 */}
      {showPinDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>
              {isChangingPin ? '输入旧 PIN' : isParentalUnlocked() ? '锁定' : '输入 PIN 解锁'}
            </h3>
            <div className="pin-display">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`pin-dot ${pinInput.length > i ? 'filled' : ''}`}
                ></div>
              ))}
            </div>
            {pinError && <p className="pin-error">{pinError}</p>}

            {isChangingPin && pinInput.length === 4 && !pinError && (
              <>
                <div className="pin-input-section">
                  <p>输入新 PIN</p>
                  <div className="pin-display small">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`pin-dot ${newPin.length > i ? 'filled' : ''}`}
                      ></div>
                    ))}
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="新 PIN"
                    className="pin-text-input"
                  />
                </div>
                <div className="pin-input-section">
                  <p>确认新 PIN</p>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="确认 PIN"
                    className="pin-text-input"
                  />
                </div>
                <button
                  className="action-button primary"
                  onClick={handleNewPinConfirm}
                  disabled={newPin.length !== 4 || confirmPin.length !== 4}
                >
                  确认修改
                </button>
              </>
            )}

            <div className="pin-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => (
                <button
                  key={i}
                  className={`keypad-button ${key === '' ? 'empty' : ''}`}
                  onClick={() => {
                    if (key === 'del') {
                      setPinInput(pinInput.slice(0, -1));
                    } else if (key !== '') {
                      handlePinInput(key.toString());
                    }
                  }}
                  disabled={key === ''}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <button
              className="dialog-close"
              onClick={() => {
                setShowPinDialog(false);
                setPinInput('');
                setPinError('');
                setIsChangingPin(false);
                setNewPin('');
                setConfirmPin('');
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <style>{`
        .parental-controls {
          padding: 24px;
          max-width: 800px;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h2 {
          font-size: 28px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0 0 8px 0;
        }

        .settings-description {
          color: var(--text-secondary, #888);
          font-size: 14px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: var(--card-bg, rgba(255,255,255,0.05));
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .setting-item.vertical {
          flex-direction: column;
          align-items: flex-start;
        }

        .setting-info h3 {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #fff);
          margin: 0 0 4px 0;
        }

        .setting-info p {
          font-size: 13px;
          color: var(--text-secondary, #888);
          margin: 0;
        }

.toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--card-bg, #333);
          border-radius: 28px;
          transition: 0.3s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .pin-button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--button-bg, rgba(255,255,255,0.1));
          color: var(--text-primary, #fff);
        }

        .pin-button:hover {
          background: var(--button-hover, rgba(255,255,255,0.2));
        }

        .pin-button.locked {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-button.primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-button.secondary {
          background: var(--button-bg, rgba(255,255,255,0.1));
          color: var(--text-primary, #fff);
        }

        .rating-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          margin-top: 16px;
        }

        .rating-option {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: var(--card-bg, rgba(255,255,255,0.05));
          border-radius: 8px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .rating-option input {
          display: none;
        }

        .rating-option.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .rating-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }

        .rating-desc {
          font-size: 11px;
          color: var(--text-secondary, #888);
          margin-top: 4px;
        }

        .media-type-options {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-option input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 14px;
          color: var(--text-primary, #fff);
        }

        .time-limit-input {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }

        .time-limit-input input {
          width: 100px;
          padding: 10px;
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          border-radius: 8px;
          background: var(--input-bg, rgba(255,255,255,0.05));
          color: var(--text-primary, #fff);
          font-size: 16px;
          text-align: center;
        }

        .time-limit-input span {
          color: var(--text-secondary, #888);
        }

        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog {
          background: var(--dialog-bg, #1a1a2e);
          border-radius: 16px;
          padding: 32px;
          min-width: 320px;
          text-align: center;
        }

        .dialog h3 {
          color: var(--text-primary, #fff);
          margin: 0 0 24px 0;
        }

        .pin-display {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .pin-display.small {
          gap: 12px;
        }

        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--border-color, #444);
          background: transparent;
          transition: all 0.2s;
        }

        .pin-dot.filled {
          background: #667eea;
          border-color: #667eea;
        }

        .pin-error {
          color: #ff6b6b;
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        .pin-keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 240px;
          margin: 0 auto;
        }

        .keypad-button {
          width: 64px;
          height: 64px;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          background: var(--button-bg, rgba(255,255,255,0.1));
          color: var(--text-primary, #fff);
          transition: all 0.2s;
        }

        .keypad-button:hover:not(:disabled) {
          background: var(--button-hover, rgba(255,255,255,0.2));
        }

        .keypad-button.empty {
          visibility: hidden;
        }

        .pin-input-section {
          margin-bottom: 16px;
        }

        .pin-input-section p {
          color: var(--text-secondary, #888);
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .pin-text-input {
          width: 120px;
          padding: 10px;
          border: 1px solid var(--border-color, #444);
          border-radius: 8px;
          background: var(--input-bg, rgba(255,255,255,0.05));
          color: var(--text-primary, #fff);
          font-size: 18px;
          text-align: center;
          letter-spacing: 8px;
        }

        .dialog-close {
          margin-top: 24px;
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary, #888);
          cursor: pointer;
          font-size: 14px;
        }

        .dialog-close:hover {
          color: var(--text-primary, #fff);
        }
      `}</style>
    </div>
  );
}
