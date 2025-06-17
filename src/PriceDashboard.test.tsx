import React, {act} from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import PriceDashboard from './PriceDashboard';

jest.mock('@fortawesome/react-fontawesome', () => ({FontAwesomeIcon: () => <span/>,}));
global.WebSocket = jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
})) as any;
const mockWebSocketInstance = {send: jest.fn(), close: jest.fn(), onmessage: null as any,};
beforeEach(() => {
    (global.WebSocket as any).mockImplementation(() => mockWebSocketInstance);
});
afterEach(() => {
    jest.clearAllMocks();
});
test('renders title and search input', () => {
    render(<PriceDashboard/>);
    expect(screen.getByText(/WELCOME TO CRYPTO-SITE!/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SEARCH/i)).toBeInTheDocument();
});
test('displays no data message initially', () => {
    render(<PriceDashboard/>);
    expect(screen.getByText(/NO DATA AVAILABLE/i)).toBeInTheDocument();
});
test('loads and displays symbols on init message', async () => {
    render(<PriceDashboard/>);
    const initMessage = {type: 'init', data: {allSymbols: ['BTC', 'ETH'], favourites: ['BTC']}};
    act(() => {
        mockWebSocketInstance.onmessage({data: JSON.stringify(initMessage)});
    });
    await waitFor(() => expect(screen.getByText('BTC')).toBeInTheDocument());
    expect(screen.getByText('ETH')).toBeInTheDocument();
});
test('updates prices and diffs on prices message', async () => {
    render(<PriceDashboard/>);
    act(() => {
        mockWebSocketInstance.onmessage({
            data: JSON.stringify({
                type: 'init',
                data: {allSymbols: ['BTC'], favourites: []}
            })
        });
    });
    act(() => {
        mockWebSocketInstance.onmessage({
            data: JSON.stringify({
                type: 'prices',
                data: {prices: {BTC: {USD: 30250.123456}}, diffs: {BTC: 'up'}}
            })
        });
    });
    await waitFor(() => expect(screen.getByText(/\$30250\.123456/)).toBeInTheDocument());
});
test('filters symbols on search input', async () => {
    render(<PriceDashboard/>);
    act(() => {
        mockWebSocketInstance.onmessage({
            data: JSON.stringify({
                type: 'init',
                data: {allSymbols: ['BTC', 'ETH', 'DOGE'], favourites: []}
            })
        });
    });
    fireEvent.change(screen.getByPlaceholderText(/SEARCH/i), {target: {value: 'doge'}});
    await waitFor(() => {
        expect(screen.queryByText('BTC')).not.toBeInTheDocument();
        expect(screen.getByText('DOGE')).toBeInTheDocument();
    });
});
test('toggles favorite status on star click', async () => {
    render(<PriceDashboard/>);
    act(() => {
        mockWebSocketInstance.onmessage({
            data: JSON.stringify({
                type: 'init',
                data: {allSymbols: ['BTC'], favourites: []}
            })
        });
    });
    const button = await screen.findByRole('button');
    fireEvent.click(button);
    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(JSON.stringify({type: 'setFavourites', data: ['BTC']}));
});
