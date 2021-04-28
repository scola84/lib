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
-- Name: item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item (
    code character varying DEFAULT 'pending'::character varying NOT NULL,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_queue_run_id bigint NOT NULL,
    id bigint NOT NULL,
    payload json NOT NULL
);


--
-- Name: item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_id_seq OWNED BY public.item.id;


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
    code character varying DEFAULT 'pending'::character varying NOT NULL,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_item_id bigint,
    fkey_queue_id bigint NOT NULL,
    id bigint NOT NULL,
    name character varying NOT NULL,
    reason text
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
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_queue_id bigint NOT NULL,
    id bigint NOT NULL,
    name character varying DEFAULT 'main'::character varying NOT NULL,
    number integer DEFAULT 1 NOT NULL,
    options json DEFAULT '{}'::json NOT NULL
);


--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;


--
-- Name: task_run; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_run (
    code character varying DEFAULT 'pending'::character varying NOT NULL,
    consumer character varying,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_queued timestamp with time zone,
    date_started timestamp with time zone,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    fkey_item_id bigint NOT NULL,
    fkey_queue_run_id bigint NOT NULL,
    fkey_task_id bigint NOT NULL,
    id bigint NOT NULL,
    reason text,
    result json DEFAULT '{}'::json NOT NULL,
    xid character varying
);


--
-- Name: task_run_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_run_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_run_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_run_id_seq OWNED BY public.task_run.id;


--
-- Name: item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item ALTER COLUMN id SET DEFAULT nextval('public.item_id_seq'::regclass);


--
-- Name: queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue ALTER COLUMN id SET DEFAULT nextval('public.queue_id_seq'::regclass);


--
-- Name: queue_run id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run ALTER COLUMN id SET DEFAULT nextval('public.queue_run_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);


--
-- Name: task_run id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_run ALTER COLUMN id SET DEFAULT nextval('public.task_run_id_seq'::regclass);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_pkey PRIMARY KEY (id);


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
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: task_run task_run_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_run
    ADD CONSTRAINT task_run_pkey PRIMARY KEY (id);


--
-- Name: item_fkey_queue_run_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_fkey_queue_run_id_idx ON public.item USING btree (fkey_queue_run_id);


--
-- Name: queue_fkey_queue_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_fkey_queue_id_idx ON public.queue USING btree (fkey_queue_id);


--
-- Name: queue_run_fkey_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_run_fkey_item_id_idx ON public.queue_run USING btree (fkey_item_id);


--
-- Name: queue_run_fkey_queue_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_run_fkey_queue_id_idx ON public.queue_run USING btree (fkey_queue_id);


--
-- Name: task_fkey_queue_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_fkey_queue_id_idx ON public.task USING btree (fkey_queue_id);


--
-- Name: task_run_fkey_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_run_fkey_item_id_idx ON public.task_run USING btree (fkey_item_id);


--
-- Name: task_run_fkey_queue_run_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_run_fkey_queue_run_id_idx ON public.task_run USING btree (fkey_queue_run_id);


--
-- Name: task_run_fkey_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_run_fkey_task_id_idx ON public.task_run USING btree (fkey_task_id);


--
-- Name: task_run item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_run
    ADD CONSTRAINT item_fkey FOREIGN KEY (fkey_item_id) REFERENCES public.item(id) ON DELETE CASCADE;


--
-- Name: queue_run item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run
    ADD CONSTRAINT item_fkey FOREIGN KEY (fkey_item_id) REFERENCES public.item(id) ON DELETE SET NULL;


--
-- Name: queue_run queue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_run
    ADD CONSTRAINT queue_fkey FOREIGN KEY (fkey_queue_id) REFERENCES public.queue(id) ON DELETE CASCADE NOT VALID;


--
-- Name: task queue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT queue_fkey FOREIGN KEY (fkey_queue_id) REFERENCES public.queue(id) ON DELETE CASCADE;


--
-- Name: queue queue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_fkey FOREIGN KEY (fkey_queue_id) REFERENCES public.queue(id) ON DELETE SET NULL DEFERRABLE;


--
-- Name: task_run queue_run_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_run
    ADD CONSTRAINT queue_run_fkey FOREIGN KEY (fkey_queue_run_id) REFERENCES public.queue_run(id) ON DELETE CASCADE;


--
-- Name: item queue_run_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT queue_run_fkey FOREIGN KEY (fkey_queue_run_id) REFERENCES public.queue_run(id) ON DELETE CASCADE NOT VALID;


--
-- Name: task_run task_run_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_run
    ADD CONSTRAINT task_run_fkey FOREIGN KEY (fkey_task_id) REFERENCES public.task(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

