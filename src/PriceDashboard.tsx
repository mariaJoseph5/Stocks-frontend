import React, {useEffect, useRef, useState} from 'react';
import './PriceDashboard.css';
import {faArrowDown, faArrowUp, faDatabase, faMinus, faStar, faSortUp, faSortDown, faMoneyBill} from '@fortawesome/free-solid-svg-icons';
import {faStar as faStarRegular} from '@fortawesome/free-regular-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

type PriceDiff = 'up' | 'down' | 'same';
const PriceDashboard = () => {
    const [allSymbols, setAllSymbols] = useState<string[]>([]);
    const [sortSymbols, setSortSymbols] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [prices, setPrices] = useState<Record<string, { USD: number }>>({});
    const [diffs, setDiffs] = useState<Record<string, PriceDiff>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const wsRef = useRef<WebSocket | null>(null);
    useEffect(() => {
        wsRef.current = new WebSocket('ws://localhost:3000');
        wsRef.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init') {
                setAllSymbols(msg.data.allSymbols);
                setFavorites(msg.data.favourites);
            } else if (msg.type === 'prices') {
                setPrices(msg.data.prices);
                setDiffs(msg.data.diffs);
            } else if (msg.type === 'favouritesUpdated') {
                setFavorites(msg.data);
            }
        };
        return () => wsRef.current?.close();
    }, []);
    const toggleFavourite = (symbol: string) => {
        const updated = favorites.includes(symbol) ? favorites.filter(s => s !== symbol) : [...favorites, symbol];
        wsRef.current?.send(JSON.stringify({type: 'setFavourites', data: updated}));
    };

    const getIconChange = (change: string | undefined) => {
        if (change === 'up') return faArrowUp;
        else if (change === 'down') return faArrowDown;
        else return faMinus;
    }

    const filterData = (filterBy: string, sortDir: string) => {
        let symbolsList: any = [];
        if (filterBy === 'NAME') {
            symbolsList = [...favorites.sort(), ...allSymbols.slice(0, 50).filter(s => !favorites.includes(s)).sort()];
            if (sortDir === 'DESC')
                symbolsList = [...favorites.sort().reverse(), ...allSymbols.slice(0, 50).filter(s => !favorites.includes(s)).sort().reverse()]
        }
        else if (filterBy === 'PRICE') {
            symbolsList = [...favorites.sort((a, b)=> (prices[a]?.USD || 0) - (prices[b]?.USD || 0)), ...allSymbols.slice(0, 50).filter(s => !favorites.includes(s)).sort((a, b)=> (prices[a]?.USD || 0 )-  (prices[b]?.USD ||  0))];
            if (sortDir === 'DESC')
                symbolsList = [...favorites.sort((a, b)=> (prices[b]?.USD || 0) - (prices[a]?.USD || 0)), ...allSymbols.slice(0, 50).filter(s => !favorites.includes(s)).sort((a, b)=> (prices[b]?.USD || 0 )-  (prices[a]?.USD ||  0))]
        }
        setSortSymbols(symbolsList);
    }

    useEffect(() => {
        setSortSymbols([...favorites.filter(a => a.toLowerCase().includes(searchTerm.toLowerCase())), ...allSymbols.slice(0, 50).filter(s => !favorites.includes(s) && s.toLowerCase().includes(searchTerm.toLowerCase()))]);
    }, [searchTerm, favorites]);

    return (<div className="price-dashboard"><h1>WELCOME TO CRYPTO-SITE!<FontAwesomeIcon color="lightsteelblue" size="1x" icon={faMoneyBill}/></h1>
        <div className="search-wrapper"><input type="text" placeholder="SEARCH" value={searchTerm}
                                               onChange={(e) => setSearchTerm(e.target.value)}/></div>
        {
            sortSymbols.length == 0 ?
                <div className="no-data-wrapper"><FontAwesomeIcon icon={faDatabase} color="grey" size="10x"/>
                    <p>NO DATA AVAILABLE</p></div> :
                <>
                    <ul className="heading-wrapper">
                        <li className="name-heading"><p>NAME</p> <div className="icon-wrapper"><FontAwesomeIcon
                            size="sm"
                            color="grey"
                            onClick={() => filterData('NAME', 'ASC')}
                            icon={faSortUp}/>
                            <FontAwesomeIcon
                                size="sm"
                                color="grey"
                                onClick={() => filterData('NAME', 'DESC')}
                                icon={faSortDown}/></div></li>
                        <li className="price-heading"><p>PRICE</p>
                            <div className="icon-wrapper"><FontAwesomeIcon
                                size="sm"
                                color="grey"
                                onClick={() => filterData('PRICE', 'ASC')}
                                icon={faSortUp}/><FontAwesomeIcon
                                size="sm"
                                color="grey"
                                onClick={() => filterData('PRICE', 'DESC')}
                                icon={faSortDown}/></div>
                        </li>
                        <li></li>
                        <li></li>
                    </ul>
                    <ul> {sortSymbols.slice(0, 50).map(symbol => {
                        const price = prices[symbol]?.USD;
                        const change = diffs[symbol];
                        return (
                            <li key={symbol}>
                                <div className="symbol-wrapper">{symbol}</div>
                                <div className="price-wrapper"> ${price?.toFixed(6) || 0}</div>
                                <div className="price-change-wrapper"><FontAwesomeIcon size="lg"
                                                                                       color={getIconChange(change) === faArrowUp ? 'green' : getIconChange(change) === faArrowDown ? 'red' : 'grey'}
                                                                                       icon={getIconChange(change)}/>
                                </div>
                                <button onClick={() => toggleFavourite(symbol)}><FontAwesomeIcon color="gold" size="lg"
                                                                                                 icon={favorites.includes(symbol) ? faStar : faStarRegular}/>
                                </button>
                            </li>
                        )
                    })}
                    </ul>
                </>}
    </div>);
};
export default PriceDashboard;