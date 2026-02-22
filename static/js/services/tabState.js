import { TAB_STATE_STORAGE_KEY } from '../core/constants.js';
import { state } from '../core/state.js';
import {
    parseTabStatePayload,
    serializeTabStatePayload
} from '../contracts/storageContracts.js';

/**
 * Tab 状态管理服务
 * 负责保存和恢复侧边栏 tab 的激活状态
 */

/**
 * 保存当前 tab 状态到 localStorage
 */
export function saveTabState() {
    try {
        const serialized = serializeTabStatePayload(state.activeIndex);
        if (!serialized) {
            console.warn('保存 tab 状态失败：数据校验未通过。');
            return;
        }
        localStorage.setItem(TAB_STATE_STORAGE_KEY, serialized);
    } catch (error) {
        console.warn('保存 tab 状态失败:', error);
    }
}

/**
 * 从 localStorage 加载 tab 状态
 * @returns {number|null} 激活的 tab 索引，如果不存在则返回 null
 */
export function loadTabState() {
    try {
        const raw = localStorage.getItem(TAB_STATE_STORAGE_KEY);
        if (!raw) return null;

        const tabState = parseTabStatePayload(raw);
        return tabState ? tabState.activeIndex : null;
    } catch (error) {
        console.warn('加载 tab 状态失败:', error);
        return null;
    }
}

/**
 * 清除保存的 tab 状态
 */
export function clearTabState() {
    try {
        localStorage.removeItem(TAB_STATE_STORAGE_KEY);
    } catch (error) {
        console.warn('清除 tab 状态失败:', error);
    }
}

/**
 * 验证 tab 索引是否有效
 * @param {number} index - 要验证的索引
 * @param {Array} categories - 分类数组
 * @returns {boolean} 索引是否有效
 */
export function isValidTabIndex(index, categories) {
    return typeof index === 'number' && 
           index >= 0 && 
           index < (categories || []).length;
}

/**
 * 获取有效的 tab 索引
 * @param {number} index - 建议的索引
 * @param {Array} categories - 分类数组
 * @returns {number} 有效的索引（默认为 0）
 */
export function getValidTabIndex(index, categories) {
    if (isValidTabIndex(index, categories)) {
        return index;
    }
    return 0; // 默认返回第一个 tab
}
