import React from 'react';
export const Font = { register: () => {} };
export const StyleSheet = { create: (styles: unknown) => styles };
export const Document = () => null;
export const Page = () => null;
export const Text = () => null;
export const View = () => null;
export const Image = () => null;
export const PDFDownloadLink = ({ children }: { children: React.ReactNode | ((state: { loading: boolean }) => React.ReactNode) }) => <a href="#pdf">{typeof children === 'function' ? children({ loading: false }) : children}</a>;
