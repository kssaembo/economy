
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;
type ImgIconProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const BankIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);

export const MartIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.44a1.125 1.125 0 0 0-.108-1.158A1.125 1.125 0 0 0 18.061 6H5.25L4.823 4.406A1.125 1.125 0 0 0 3.736 3.5H2.25m3.75 11.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm12.75 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

export const StudentIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

export const DashboardIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l-1.5-1.5m1.5 1.5.75-.75m1.5-1.5-1.5-1.5m1.5 1.5.75-.75M7.5 15.75l-1.5-1.5m1.5 1.5.75-.75m1.5-1.5-1.5-1.5m1.5 1.5L9 15m9-3l-1.5-1.5m1.5 1.5.75-.75m1.5-1.5-1.5-1.5m1.5 1.5.75-.75m-6 4.5l-1.5-1.5m1.5 1.5.75-.75m1.5-1.5-1.5-1.5m1.5 1.5.75-.75M12 21v-4.5m0 4.5-1.5-1.5m1.5 1.5.75-.75m1.5-1.5-1.5-1.5m1.5 1.5.75-.75M12 3v4.5m0-4.5-1.5 1.5M12 3l1.5 1.5M12 3l.75.75m-1.5-1.5L9 4.5m3-1.5-1.5 1.5m1.5 1.5L15 4.5m-3-1.5l.75.75m-1.5-1.5L9 4.5" />
    </svg>
);

export const UserAddIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 12a4.125 4.125 0 100-8.25 4.125 4.125 0 000 8.25z" />
  </svg>
);

export const QrCodeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 15.75h4.5v-4.5h-4.5v4.5z" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const TransferIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

export const StockIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28L19.5 12" />
    </svg>
);

export const PiggyBankIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9M3 12V9M15 6.75a3 3 0 00-3-3H9a3 3 0 00-3 3v2.25a3 3 0 003 3h3a3 3 0 003-3V6.75z" />
  </svg>
);

export const ManageIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const BackIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const MinusIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.07a2.25 2.25 0 0 1-2.25 2.25H5.92a2.25 2.25 0 0 1-2.25-2.25v-4.07a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v.075a.75.75 0 0 0 1.5 0v-.075a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25v-4.07a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v.075a.75.75 0 0 1-1.5 0v-.075a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 9.43v4.07a2.25 2.25 0 0 0 2.25 2.25H9M12 3.75l.75 .75m-.75-.75L11.25 4.5m1.5-.75L12.75 4.5m-1.5-.75L12 3m0 0 .75.75m-.75-.75L11.25 4.5M12 3l.75.75M12 3l-.75.75" />
    </svg>
);

export const BellIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

export const NewspaperIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h10.5m-10.5 3h10.5m-10.5-15h10.5a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V4.5a2.25 2.25 0 0 1 2.25-2.25Z" />
  </svg>
);

export const NewDashboardIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin%20dashboard2.png" alt="Dashboard" {...props} />
);

export const NewStudentIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin_student-removebg-preview.png" alt="Student Management" {...props} />
);

export const NewBriefcaseIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin_role-removebg-preview.png" alt="Jobs" {...props} />
);

export const NewJobIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/942/942749.png" alt="Jobs" {...props} />
);

export const NewManageAccountsIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin_account-removebg-preview.png" alt="Account Management" {...props} />
);

export const NewStockIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/3843/3843966.png" alt="Stocks" {...props} />
);

export const NewPiggyBankIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/2447/2447436.png" alt="Savings" {...props} />
);

export const NewMartIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/3081/3081986.png" alt="Mart" {...props} />
);

export const NewHistoryIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/6433/6433807.png" alt="History" {...props} />
);

export const NewBankerIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://cdn-icons-png.flaticon.com/512/831/831466.png" alt="Banker" {...props} />
);

export const NewTaxIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin_tax-removebg-preview.png" alt="Tax" {...props} />
);

export const NewFundIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/admin_fund-removebg-preview.png" alt="Fund" {...props} />
);

export const MainAdminIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/main_admin-removebg-preview.png" alt="Admin" {...props} />
);

export const MainBankIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/main_bank-removebg-preview.png" alt="Banker" {...props} />
);

export const MainMartIcon: React.FC<ImgIconProps> = (props) => (
    <img src="https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/main_mart-removebg-preview.png" alt="Mart" {...props} />
);
