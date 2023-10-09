import React, { useCallback, useEffect, useState } from 'react';
import Layout from "../layout/Layout";
import {API} from "../config";

import Cards from '../components/ui/Cards';
import "../styles/dashboard.css";
import 'react-toastify/dist/ReactToastify.css';

import { io } from "socket.io-client";

// const socket = io("http://localhost:3003");
const socket = io("https://tatapower.esys.co.in:3003", {secure: true});

const Dashboard = () => {
    const [bypassedMachines, setBypassedMachines] = useState([]);

    const [listOfMachines, setListOfMachines] = useState([]);
    const [listOfFeederNumber, setListOfFeederNumber] = useState([]);

    // ---------------------------------------------------------------------------
    // Generating new states depending upon the machines list
    const [states, setStates] = useState([]);

    useEffect(() => {
        setStates(listOfMachines.map(machine => machine.initialState));
    }, [listOfMachines]);

    const handleUpdateState = (index, newState) => {
        setStates(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = newState;
            return newStates;
        });
    };
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // Fetching list of machines from the db
    const fetchWegid = useCallback(async () => {
        await fetch(`${API}/fetchWegid`)
            .then(res => {
                res.json()
                    .then(result => {
                        const data = result.listOfWegid.wegid;
                        const feedNum = result.listOfFeederNumber.feeder_number;
                        if (data !== [] && feedNum !== []) {
                            setListOfMachines(data);
                            setListOfFeederNumber(feedNum);
                        } else {
                            setListOfMachines(listOfMachines);
                            setListOfFeederNumber(listOfFeederNumber);
                        }
                    })
            })
    }, [listOfMachines, listOfFeederNumber]);

    useEffect(() => {
        if (listOfMachines.length === 0) {
            fetchWegid();
        } else {
            listOfMachines.map((machine, i) => {
                return handleUpdateState(i, machine);
            });
        }
    }, [listOfMachines, fetchWegid]);
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // Getting data from Socket.io stream and 
    socket.on("recieve-temp", (liveDatum) => {
        const key = liveDatum.data.wegid;
        setStates(prevValues => ({
            ...prevValues,
            [key]: liveDatum
        }));
        
    });
    // ---------------------------------------------------------------------------
    
    // ---------------------------------------------------------------------------
    // showCard function
    const showCards = useCallback(() => {
        // ---------------------------------------------------------------------------
        // Bypass feature
        const handleBypassToggle = (machineName, isBypassed) => {
            const updatedMachines = bypassedMachines.slice();
            if (isBypassed) {
                updatedMachines.push(machineName);
            } else {
                const index = updatedMachines.indexOf(machineName);
                updatedMachines.splice(index, 1);
            }
            setBypassedMachines(updatedMachines);
        };
        // ---------------------------------------------------------------------------
        return (
            <div className='dashboard--machine-cards'>
                {listOfMachines.length !== 0 && listOfMachines.map((machineName, i) => {
                        
                    if (states[machineName] !== undefined) {
                        var dataToShow = states[machineName].data;
                    }
                    const feed_num = listOfFeederNumber[i]
                    const isBypassed = bypassedMachines.includes(machineName);
                    return (
                        <Cards
                            key={machineName}
                            data={{ machineName, dataToShow, feed_num }}
                            isBypassed={isBypassed}
                            onBypassToggle={handleBypassToggle}
                            
                        />
                    )
                })}
            </div>
        );
    }, [listOfFeederNumber, listOfMachines, states, bypassedMachines]);
    // ---------------------------------------------------------------------------

    const bypassedCount = bypassedMachines.length; 
    
    return (
        <Layout>
            <div className='dashboard--container'>
                <div className="dashboard--machines-info-boxes">
                    <div className="dashboard--machiches-info-box">
                        <p>Total Machines</p>
                        <p>{listOfMachines.length}</p>
                    </div>
                    <div className="dashboard--machiches-info-box">
                        <p>Normal Machines</p>
                        <p>{listOfMachines.length}</p>
                    </div>
                    <div className="dashboard--machiches-info-box">
                        <p>Error Machines</p>
                        <p className='data-style'>{0}</p>
                    </div>
                    <div className="dashboard--machiches-info-box">
                        <p>Bypassed Machines</p>
                        <p className='data-style'>{bypassedCount}</p>
                    </div>
                </div>
                {showCards()}
                
            </div>
        </Layout>
    );
};

export default Dashboard