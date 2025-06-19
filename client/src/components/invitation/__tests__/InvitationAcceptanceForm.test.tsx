
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { InvitationAcceptanceForm } from '../InvitationAcceptanceForm';

describe('InvitationAcceptanceForm', () => {
  const mockInvitation = {
    email: 'test@example.com',
    role: 'user' as const,
    message: 'Welcome to our team!'
  };

  const defaultProps = {
    invitation: mockInvitation,
    isLoggedIn: false,
    onAccept: vi.fn(),
    isLoading: false
  };

  it('renders invitation details correctly', () => {
    render(<InvitationAcceptanceForm {...defaultProps} />);
    
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Welcome to our team!')).toBeInTheDocument();
  });

  it('shows account creation form when user is not logged in', () => {
    render(<InvitationAcceptanceForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('hides account creation form when user is logged in', () => {
    render(<InvitationAcceptanceForm {...defaultProps} isLoggedIn={true} />);
    
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password *')).not.toBeInTheDocument();
  });

  it('validates required fields for new users', async () => {
    const mockOnAccept = vi.fn();
    render(<InvitationAcceptanceForm {...defaultProps} onAccept={mockOnAccept} />);
    
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  it('validates password confirmation', async () => {
    const mockOnAccept = vi.fn();
    render(<InvitationAcceptanceForm {...defaultProps} onAccept={mockOnAccept} />);
    
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });
    
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  it('validates minimum password length', async () => {
    const mockOnAccept = vi.fn();
    render(<InvitationAcceptanceForm {...defaultProps} onAccept={mockOnAccept} />);
    
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  it('submits valid form data', async () => {
    const mockOnAccept = vi.fn().mockResolvedValue(undefined);
    render(<InvitationAcceptanceForm {...defaultProps} onAccept={mockOnAccept} />);
    
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /accept invitation/i }));
    
    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });
  });

  it('shows loading state during submission', () => {
    render(<InvitationAcceptanceForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText(/accepting.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables form fields during loading', () => {
    render(<InvitationAcceptanceForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).toBeDisabled();
    expect(screen.getByLabelText('Password *')).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
  });
});
