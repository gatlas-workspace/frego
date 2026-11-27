/**
 * Giữ khoảng giá trên một dòng ("21.000–26.000đ" không bị ngắt ở dấu gạch),
 * như `white-space: nowrap` của thiết kế: chèn ký tự nối từ (U+2060) quanh dấu gạch, đổi dấu cách thành dấu cách không ngắt.
 */
const WORD_JOINER = '\u2060';
const NBSP = '\u00a0';

export function noBreak(text: string): string {
  return text.replace(/[\u2013\u2212-]/g, (d) => WORD_JOINER + d + WORD_JOINER).replace(/ /g, NBSP);
}
