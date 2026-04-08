'use client'

import { DateFilter, Notifications, Theme } from './HeaderComponents';
import { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';

export default function Header({ DateValue, onDateChange, tempDate, showDateFilter = true }) {
    const [userName, setUserName] = useState('User');
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUserName(userData.name.split(' ')[0] || userData.firstName || 'User');
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    return (
        <div className="sticky top-0 z-50 w-full">
            <header
                className='w-full text-foreground px-4 bg-background/80 backdrop-blur-[6px]'
                style={{
                    borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.06)',
                }}
            >

                {/* Main row: hamburger | welcome | [date desktop] | buttons */}
                <div className="h-16 flex flex-row items-center justify-between gap-2">
                    {/* Left: hamburger (mobile) + welcome text */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SidebarTrigger className="md:hidden shrink-0" />
                        <div className="text-left min-w-0">
                            <p className='text-base md:text-xl font-bold truncate'>
                                Welcome <span className='text-primary'>{userName}</span>
                            </p>
                            <span className='text-sm truncate block'>
                                Start your <span className='font-medium'>Persona</span><span className='text-primary font-bold'>AI</span> Journey
                            </span>
                        </div>
                    </div>

                    {/* Center: date label (desktop only) */}
                    <div className="hidden md:block shrink-0">
                        <p className='text-sm font-bold'>Date Set : {tempDate}</p>
                    </div>

                    {/* Right: DateFilter (sm+) + Notifications + Theme */}
                    <div className='h-full flex items-center gap-2 shrink-0'>
                        {showDateFilter && (
                            <div className="hidden sm:block">
                                <DateFilter value={DateValue} onValueChange={onDateChange} />
                            </div>
                        )}
                        <Notifications />
                        <Theme />
                    </div>
                </div>

                {/* Second row — mobile only: DateFilter aligned with welcome text */}
                {showDateFilter && (
                    <div className="sm:hidden pb-3 flex items-center">
                        {/* Spacer matches SidebarTrigger width (h-7 w-7 button = ~28px) + gap-2 (8px) */}
                        <div className="w-[calc(1.75rem+0.5rem)] shrink-0" />
                        <DateFilter value={DateValue} onValueChange={onDateChange} />
                    </div>
                )}

            </header>
        </div>
    )
}
