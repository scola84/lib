--
-- PostgreSQL database dump
--

-- Dumped from database version 13.0
-- Dumped by pg_dump version 13.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: queue; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE queue WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';


\connect queue

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;


--
-- Name: queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue (
    database character varying,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_queue_id bigint,
    id bigint NOT NULL,
    name character varying NOT NULL,
    options json DEFAULT '{}'::json NOT NULL,
    query text,
    schedule character varying,
    schedule_begin timestamp with time zone,
    schedule_end timestamp with time zone,
    schedule_next timestamp with time zone
);


--
-- Name: queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.queue_id_seq OWNED BY public.queue.id;


--
-- Name: queue_run; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue_run (
    aggr_err integer DEFAULT 0 NOT NULL,
    aggr_ok integer DEFAULT 0 NOT NULL,
    aggr_total integer DEFAULT 0 NOT NULL,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_queue_id bigint NOT NULL,
    fkey_queue_task_id bigint,
    id bigint NOT NULL,
    name character varying NOT NULL,
    options json DEFAULT '{}'::json NOT NULL,
    reason text,
    status character varying DEFAULT 'pending'::character varying NOT NULL
);


--
-- Name: queue_run_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.queue_run_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: queue_run_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.queue_run_id_seq OWNED BY public.queue_run.id;


--
-- Name: queue_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue_task (
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_queued timestamp with time zone,
    date_started timestamp with time zone,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_queue_run_id bigint NOT NULL,
    host character varying,
    id bigint NOT NULL,
    payload json NOT NULL,
    reason text,
    result json DEFAULT '{}'::json NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL
);


--
-- Name: queue_task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.queue_task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: queue_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.queue_task_id_seq OWNED BY public.queue_task.id;


--
-- Name: queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue ALTER COLUMN id SET DEFAULT nextval('public.queue_id_seq'::regclass);


--
-- Name: queue_run id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run ALTER COLUMN id SET DEFAULT nextval('public.queue_run_id_seq'::regclass);


--
-- Name: queue_task id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_task ALTER COLUMN id SET DEFAULT nextval('public.queue_task_id_seq'::regclass);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (id);


--
-- Name: queue_run queue_run_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run
    ADD CONSTRAINT queue_run_pkey PRIMARY KEY (id);


--
-- Name: queue_task queue_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_task
    ADD CONSTRAINT queue_task_pkey PRIMARY KEY (id);


--
-- Name: queue_fkey_queue_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_fkey_queue_id_idx ON public.queue USING btree (fkey_queue_id);


--
-- Name: queue_run_fkey_queue_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_run_fkey_queue_task_id_idx ON public.queue_run USING btree (fkey_queue_task_id);


--
-- Name: queue_run_fkey_queue_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_run_fkey_queue_id_idx ON public.queue_run USING btree (fkey_queue_id);


--
-- Name: queue_task_fkey_queue_run_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_task_fkey_queue_run_id_idx ON public.queue_task USING btree (fkey_queue_run_id);


--
-- Name: queue_run queue_task_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run
    ADD CONSTRAINT queue_task_fkey FOREIGN KEY (fkey_queue_task_id) REFERENCES public.queue_task(id) ON DELETE SET NULL;


--
-- Name: queue_run queue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run
    ADD CONSTRAINT queue_fkey FOREIGN KEY (fkey_queue_id) REFERENCES public.queue(id) ON DELETE CASCADE NOT VALID;


--
-- Name: queue queue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_fkey FOREIGN KEY (fkey_queue_id) REFERENCES public.queue(id) ON DELETE SET NULL DEFERRABLE;


--
-- Name: queue_task queue_run_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_task
    ADD CONSTRAINT queue_run_fkey FOREIGN KEY (fkey_queue_run_id) REFERENCES public.queue_run(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
