import React from 'react';
import {render, screen} from '@testing-library/react';
import App from './App';

jest.mock('./PriceDashboard', () => () => <div>Mocked PriceDashboard</div>);
test('renders PriceDashboard component', () => {
    render(<App/>);
    expect(screen.getByText('Mocked PriceDashboard')).toBeInTheDocument();
});